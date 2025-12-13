import { prisma } from "./prisma";
import { SessionUser } from "@/types/auth";

export async function logAction(
  actor: SessionUser,
  action: string,
  targetId?: string,
  targetType?: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role, // Role is stored as string in database
        action,
        targetId,
        targetType,
        metadata: metadata ? JSON.stringify(metadata) : null, // Store as JSON string for SQL Server
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error("Failed to log audit action:", error);
  }
}

/**
 * Log tenant violation (when tenantWhere throws or validateTenantScope fails)
 */
export async function logTenantViolation(
  actor: SessionUser,
  reason: string,
  metadata?: Record<string, any>
) {
  await logAction(
    actor,
    "TENANT_VIOLATION",
    actor.id,
    "User",
    {
      reason,
      ...metadata,
    }
  );
}

// Campaign session action types
export const CAMPAIGN_ACTIONS = {
  SESSION_STARTED: "CAMPAIGN_SESSION_STARTED",
  MESSAGE_OPENED: "CAMPAIGN_MESSAGE_OPENED",
  MESSAGE_SENT: "CAMPAIGN_MESSAGE_SENT",
  MESSAGE_SKIPPED: "CAMPAIGN_MESSAGE_SKIPPED",
  MESSAGE_FAILED: "CAMPAIGN_MESSAGE_FAILED",
  SESSION_COMPLETED: "CAMPAIGN_SESSION_COMPLETED",
  SESSION_CANCELLED: "CAMPAIGN_SESSION_CANCELLED",
} as const;

