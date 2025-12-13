import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES, isValidRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import type { AuditLogFilters } from "@/types/admin";

export const dynamic = "force-dynamic";

/**
 * Redact PII from metadata for display
 */
function redactPII(text: string): string {
  if (!text) return text;
  // Remove email patterns
  let redacted = text.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, "[EMAIL]");
  // Remove phone patterns
  redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");
  return redacted;
}

/**
 * GET /api/admin/audit-logs
 * List audit logs with filters, pagination, and search
 */
export async function GET(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_AUDIT_LOGS][${correlationId}] GET request`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const action = searchParams.get("action") || undefined;
    const actorRole = searchParams.get("actorRole") || undefined;
    const targetType = searchParams.get("targetType") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Build where clause
    const where: any = {};

    // Action filter (SQL Server case-insensitive by default)
    if (action) {
      where.action = { contains: action };
    }

    // Actor role filter
    if (actorRole && isValidRole(actorRole)) {
      where.actorRole = actorRole;
    }

    // Target type filter
    if (targetType) {
      where.targetType = targetType;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include entire end date
        where.createdAt.lte = end;
      }
    }

    // Search filter (actor name/email - would need to join with User table)
    // For now, we'll search in action and metadata
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { metadata: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortDir;
    } else {
      orderBy[sortBy] = sortDir;
    }

    // Get audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get actor names (join with User table)
    const actorIds = Array.from(new Set(auditLogs.map((log) => log.actorId)));
    const actors = await prisma.user.findMany({
      where: {
        id: { in: actorIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const actorMap = new Map(actors.map((a) => [a.id, a]));

    // Format response with actor info and redacted metadata
    const formattedLogs = auditLogs.map((log) => {
      const actor = actorMap.get(log.actorId);
      let metadataPreview = null;
      let metadataRedacted = null;

      if (log.metadata) {
        try {
          const metadata = JSON.parse(log.metadata);
          metadataPreview = JSON.stringify(metadata, null, 2).substring(0, 200);
          metadataRedacted = redactPII(metadataPreview);
        } catch {
          metadataPreview = log.metadata.substring(0, 200);
          metadataRedacted = redactPII(metadataPreview);
        }
      }

      return {
        ...log,
        actorName: actor?.name || "Unknown",
        actorEmail: actor?.email || null,
        metadataPreview: metadataRedacted,
        metadataFull: log.metadata, // Full metadata for expandable view (already redacted in preview)
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_AUDIT_LOGS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to fetch audit logs",
        },
        correlationId,
      },
      { status: error.message?.includes("required") ? 403 : 500 }
    );
  }
}
