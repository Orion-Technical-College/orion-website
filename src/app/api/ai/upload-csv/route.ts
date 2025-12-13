import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";
import { processCSVWithAI } from "@/lib/ai-service";
import { randomUUID } from "crypto";

// Force dynamic rendering since we use session
export const dynamic = "force-dynamic";

/**
 * Feature flag check
 */
function isFeatureEnabled(): boolean {
  return process.env.FEATURE_AI_ASSISTANT !== "false";
}

/**
 * Check if user role has access to AI Assistant
 */
function hasAIAccess(userRole: string): boolean {
  return userRole === ROLES.PLATFORM_ADMIN || userRole === ROLES.RECRUITER;
}

/**
 * POST /api/ai/upload-csv
 * CSV upload endpoint for AI-assisted import
 * This is a simplified version - full implementation would integrate with existing CSV import pipeline
 */
export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  let user;

  try {
    // Authentication
    user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", correlationId },
        { status: 401 }
      );
    }

    // Feature flag check
    if (!isFeatureEnabled()) {
      return NextResponse.json(
        { error: "AI Assistant is not available", correlationId },
        { status: 403 }
      );
    }

    // Role-based access check
    if (!hasAIAccess(user.role)) {
      await logAction(
        user,
        "AI_ASSISTANT_ACCESS_DENIED",
        undefined,
        undefined,
        { reason: "insufficient_role", role: user.role, correlationId }
      );
      return NextResponse.json(
        { error: "You do not have access to the AI Assistant", correlationId },
        { status: 403 }
      );
    }

    // Rate limiting
    const rateLimitKey = `ai-csv:${user.id}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10, 60 * 1000); // 10 uploads per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again shortly.",
          correlationId,
        },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", correlationId },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const allowedExtensions = [".csv", ".xls", ".xlsx"];

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      return NextResponse.json(
        {
          error: "Invalid file type. Please upload a CSV or Excel file.",
          correlationId,
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File size exceeds 10MB limit.",
          correlationId,
        },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV (basic parsing - would use PapaParse in full implementation)
    const lines = fileContent.split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      return NextResponse.json(
        { error: "File is empty", correlationId },
        { status: 400 }
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const sampleRows = lines.slice(1, 6).map((line) =>
      line.split(",").map((cell) => cell.trim())
    );

    // Process with AI
    const aiResult = await processCSVWithAI(headers, sampleRows);

    // Audit logging
    await logAction(
      user,
      "AI_CSV_ASSIST",
      undefined,
      undefined,
      {
        correlationId,
        filename: file.name,
        fileSize: file.size,
        rowCount: lines.length - 1,
        phase: aiResult.csvAssist?.phase || "analysis",
      }
    );

    return NextResponse.json({
      message: aiResult.message,
      csvAssist: aiResult.csvAssist,
      headers,
      sampleRows,
      correlationId,
    });
  } catch (error: any) {
    console.error("AI CSV upload error:", error);

    if (user) {
      await logAction(
        user,
        "AI_CSV_ASSIST_ERROR",
        undefined,
        undefined,
        {
          correlationId,
          error: error.message || "Unknown error",
        }
      );
    }

    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Unauthorized", correlationId },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "An error occurred processing your CSV file. Please try again.",
        correlationId,
      },
      { status: 500 }
    );
  }
}
