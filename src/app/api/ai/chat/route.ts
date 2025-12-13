import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";
import { tenantWhere } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { chatWithContext } from "@/lib/ai-service";
import { ensureAzureConfig } from "@/lib/azure-openai-client";
import { ConfigurationError } from "@/lib/errors";
import { getLangfuseClient } from "@/lib/langfuse-client";
import {
  validateAndNormalizeFilters,
  extractSimplePatterns,
  hasActiveFilters,
} from "@/lib/ai-query-parser";
import type { FilterState } from "@/lib/filtering";
import type { Message } from "@/types";
import { randomUUID } from "crypto";

// Force dynamic rendering since we use session
export const dynamic = "force-dynamic";

/**
 * Feature flag check - can be controlled via environment variable or tenant settings
 */
function isFeatureEnabled(): boolean {
  // For v1, check environment variable
  // Future: check tenant-specific feature flags
  return process.env.FEATURE_AI_ASSISTANT !== "false";
}

/**
 * Check if user role has access to AI Assistant
 */
function hasAIAccess(userRole: string): boolean {
  return userRole === ROLES.PLATFORM_ADMIN || userRole === ROLES.RECRUITER;
}

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Redact candidate PII from prompt/response for logging
 */
function redactPII(text: string): string {
  // Remove email patterns
  let redacted = text.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, "[EMAIL]");
  // Remove phone patterns
  redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");
  // Remove candidate names (simple heuristic - could be improved)
  // For now, just return a summary
  return redacted.substring(0, 200) + (redacted.length > 200 ? "..." : "");
}

/**
 * POST /api/ai/chat
 * Main endpoint for AI chat interactions
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  console.log(`[AI_CHAT][${correlationId}] Incoming request`);

  // Log environment check (presence only)
  console.log(`[AI_CHAT][${correlationId}] Environment check`, {
    hasAzureKey: !!process.env.AZURE_OPENAI_API_KEY,
    hasAzureEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
    hasDbUrl: !!process.env.DATABASE_URL,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o (default)"
  });

  let user;

  try {
    ensureAzureConfig();

    // Authentication
    try {
      user = await requireAuth();
      console.log(`[AI_CHAT][${correlationId}] Auth OK`, { userId: user?.id, role: user?.role });
    } catch (authError: any) {
      console.error(`[AI_CHAT][${correlationId}] Auth failed`, authError);
      return NextResponse.json(
        { error: "Unauthorized", correlationId, detail: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", correlationId },
        { status: 401 }
      );
    }

    // Feature flag check
    if (!isFeatureEnabled()) {
      console.log(`[AI_CHAT][${correlationId}] Feature disabled`);
      try {
        await logAction(
          user,
          "AI_ASSISTANT_ACCESS_DENIED",
          undefined,
          undefined,
          { reason: "feature_disabled", correlationId }
        );
      } catch (logErr) {
        console.error(`[AI_CHAT][${correlationId}] logAction failed`, logErr);
      }
      return NextResponse.json(
        { error: "AI Assistant is not available", correlationId },
        { status: 403 }
      );
    }

    // Role-based access check
    if (!hasAIAccess(user.role)) {
      console.log(`[AI_CHAT][${correlationId}] Access denied for role: ${user.role}`);
      try {
        await logAction(
          user,
          "AI_ASSISTANT_ACCESS_DENIED",
          undefined,
          undefined,
          { reason: "insufficient_role", role: user.role, correlationId }
        );
      } catch (logErr) {
        console.error(`[AI_CHAT][${correlationId}] logAction failed`, logErr);
      }
      return NextResponse.json(
        { error: "You do not have access to the AI Assistant", correlationId },
        { status: 403 }
      );
    }

    // Rate limiting (20 requests per minute per user)
    const rateLimitKey = `ai-chat:${user.id}`;
    const rateLimit = checkRateLimit(rateLimitKey, 20, 60 * 1000);
    if (!rateLimit.allowed) {
      console.log(`[AI_CHAT][${correlationId}] Rate limit exceeded`);
      try {
        await logAction(
          user,
          "AI_ASSISTANT_RATE_LIMIT",
          undefined,
          undefined,
          { correlationId }
        );
      } catch (logErr) {
        console.error(`[AI_CHAT][${correlationId}] logAction failed`, logErr);
      }
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again shortly.",
          correlationId,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, conversationHistory = [], includeDataContext = true, sessionId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required", correlationId },
        { status: 400 }
      );
    }

    // Fetch candidate data with tenant isolation
    let candidateContext: any[] = [];
    if (includeDataContext) {
      try {
        console.log(`[AI_CHAT][${correlationId}] Fetching candidate context`);
        const candidates = await prisma.candidate.findMany({
          where: {
            ...tenantWhere(user),
          },
          include: {
            client: {
              select: {
                name: true,
              },
            },
          },
          take: 30, // Limit to MAX_ROWS
        });
        console.log(`[AI_CHAT][${correlationId}] Fetched ${candidates.length} candidates`);

        candidateContext = candidates.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          source: c.source,
          client: c.client?.name || null,
          jobTitle: c.jobTitle,
          location: c.location,
          date: c.date,
          status: c.status,
          notes: c.notes,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
      } catch (error) {
        console.error(`[AI_CHAT][${correlationId}] Error fetching candidate context:`, error);
        // Continue without context rather than failing
      }
    }

    // Try simple pattern extraction first (cost reduction)
    const simpleFilters = extractSimplePatterns(message);
    let suggestedFilters: FilterState | undefined;
    let warnings: string[] = [];

    // Call AI service
    const conversationHistoryTyped: Message[] = conversationHistory.map((msg: any) => ({
      id: msg.id || randomUUID(),
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    }));

    // Create or retrieve Langfuse session
    const langfuse = getLangfuseClient();
    let langfuseSessionId = sessionId;

    if (langfuse && !langfuseSessionId) {
      // Create new session ID if not provided
      langfuseSessionId = `session-${user.id}-${Date.now()}`;
    }

    console.log(`[AI_CHAT][${correlationId}] Calling chatWithContext`);
    const aiResult = await chatWithContext(
      message,
      conversationHistoryTyped,
      candidateContext,
      user.role,
      user.clientId,
      {
        correlationId,
        userId: user.id,
        sessionId: langfuseSessionId,
      }
    );
    console.log(`[AI_CHAT][${correlationId}] chatWithContext returned`);

    // Check if result is a generic error message (indicates underlying issue)
    if (aiResult.message.includes("could not process") ||
      aiResult.message.includes("not configured correctly") ||
      aiResult.message.includes("network issue")) {
      console.warn(`[AI_CHAT][${correlationId}] AI service returned error message:`, {
        message: aiResult.message,
        hasFilters: !!aiResult.filters,
        hasInsights: !!aiResult.insights,
      });
    }

    // If simple patterns were found, use them; otherwise try to extract from AI response
    if (simpleFilters && hasActiveFilters(simpleFilters)) {
      const validation = validateAndNormalizeFilters(simpleFilters);
      suggestedFilters = validation.filters;
      warnings = validation.warnings;
    } else if (aiResult.filters) {
      // AI suggested filters - validate them
      const validation = validateAndNormalizeFilters(aiResult.filters);
      suggestedFilters = validation.filters;
      warnings = [...(aiResult.warnings || []), ...validation.warnings];
    }

    // Audit logging (minimal PII)
    try {
      await logAction(
        user,
        "AI_QUERY_CANDIDATES",
        undefined,
        undefined,
        {
          correlationId,
          query_type: "candidate_filter",
          has_filters: !!suggestedFilters,
          has_warnings: warnings.length > 0,
          candidate_count: candidateContext.length,
          // Redacted prompt/response
          query_summary: redactPII(message),
          response_summary: redactPII(aiResult.message).substring(0, 100),
        }
      );
    } catch (logErr) {
      console.error(`[AI_CHAT][${correlationId}] logAction failed`, logErr);
    }

    // Flush Langfuse events (important for serverless)
    if (langfuse) {
      try {
        await langfuse.flushAsync();
      } catch (flushError) {
        console.error(`[AI_CHAT][${correlationId}] Failed to flush Langfuse:`, flushError);
      }
    }

    // Return response
    return NextResponse.json({
      response: aiResult.message,
      suggestedFilters,
      warnings: warnings.length > 0 ? warnings : undefined,
      insights: aiResult.insights,
      correlationId,
      sessionId: langfuseSessionId, // Return session ID for client-side tracking
      traceId: aiResult.traceId, // Return traceId for feedback linking
    });
  } catch (error: any) {
    if (error instanceof ConfigurationError) {
      console.error(`[AI_CHAT][${correlationId}] Configuration error`, {
        message: error.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'CONFIGURATION_ERROR',
            code: error.code,
            message: 'AI Service Configuration Error',
            detail: error.message,
          },
          correlationId,
        },
        { status: 500 }
      );
    }

    console.error(`[AI_CHAT][${correlationId}] Unhandled error:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Log error
    if (user) {
      try {
        await logAction(
          user,
          "AI_ASSISTANT_ERROR",
          undefined,
          undefined,
          {
            correlationId,
            error: error.message || "Unknown error",
          }
        );
      } catch (logErr) {
        console.error(`[AI_CHAT][${correlationId}] logAction failed during error handling`, logErr);
      }
    }

    return NextResponse.json(
      {
        error: "An error occurred processing your request. Please try again.",
        correlationId,
        detail: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
