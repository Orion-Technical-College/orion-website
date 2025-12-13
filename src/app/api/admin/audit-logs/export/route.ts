import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES, isValidRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Redact PII from metadata for export
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
 * GET /api/admin/audit-logs/export
 * Export audit logs to CSV with rate limiting
 */
export async function GET(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_AUDIT_LOGS_EXPORT][${correlationId}] GET request`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    // Rate limiting (stricter for exports)
    const rateLimitKey = `audit-export:${user.id}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60 * 1000); // 5 exports per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Export rate limit exceeded. Please try again in a moment.",
          },
          correlationId,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const actorRole = searchParams.get("actorRole") || undefined;
    const targetType = searchParams.get("targetType") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const search = searchParams.get("search") || undefined;
    const includeMetadata = searchParams.get("includeMetadata") === "true";

    // Build where clause (same as list endpoint)
    const where: any = {};

    if (action) {
      where.action = { contains: action };
    }

    if (actorRole && isValidRole(actorRole)) {
      where.actorRole = actorRole;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { metadata: { contains: search } },
      ];
    }

    // Limit export to 10,000 rows for performance
    const MAX_EXPORT_ROWS = 10000;
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: MAX_EXPORT_ROWS,
    });

    // Get actor names
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

    // Generate CSV
    const headers = ["Timestamp", "Actor", "Actor Email", "Actor Role", "Action", "Target Type", "Target ID"];
    if (includeMetadata) {
      headers.push("Metadata");
    }

    const rows = auditLogs.map((log) => {
      const actor = actorMap.get(log.actorId);
      const row = [
        log.createdAt.toISOString(),
        actor?.name || "Unknown",
        actor?.email || "",
        log.actorRole,
        log.action,
        log.targetType || "",
        log.targetId || "",
      ];

      if (includeMetadata && log.metadata) {
        const metadataRedacted = redactPII(log.metadata);
        row.push(metadataRedacted);
      }

      // Escape CSV values
      return row.map((cell) => {
        const str = String(cell || "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error(`[ADMIN_AUDIT_LOGS_EXPORT][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to export audit logs",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}
