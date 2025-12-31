/**
 * ELITE Audit Logger
 * 
 * Logs all actions performed in the ELITE workspace for compliance and debugging.
 * Uses the existing AuditLog model.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "./types";
import type { AuditEntry } from "./types";

/**
 * ELITE Audit Logger
 */
export class EliteAudit {
  constructor(private ctx: EliteContext) {}

  /**
   * Log an action with full context
   */
  async log(
    action: string,
    target: { type: string; id: string },
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: this.ctx.userId,
          actorRole: this.ctx.eliteRole,
          action: `ELITE_${action}`,
          targetId: target.id,
          targetType: target.type,
          metadata: metadata
            ? JSON.stringify({
                ...metadata,
                tenantId: this.ctx.tenantId,
                orgUnitId: this.ctx.orgUnitId,
              })
            : JSON.stringify({
                tenantId: this.ctx.tenantId,
                orgUnitId: this.ctx.orgUnitId,
              }),
        },
      });
    } catch (error) {
      // Log errors but don't fail the operation
      console.error("[EliteAudit] Failed to log action:", error);
    }
  }

  /**
   * Log cohort-related action
   */
  async logCohort(
    action: string,
    cohortId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log(action, { type: "Cohort", id: cohortId }, metadata);
  }

  /**
   * Log session-related action
   */
  async logSession(
    action: string,
    sessionId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log(action, { type: "EliteSession", id: sessionId }, metadata);
  }

  /**
   * Log coaching-related action
   */
  async logCoaching(
    action: string,
    noteId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log(action, { type: "CoachingNote", id: noteId }, metadata);
  }

  /**
   * Log assignment-related action
   */
  async logAssignment(
    action: string,
    assignmentId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log(action, { type: "Assignment", id: assignmentId }, metadata);
  }

  /**
   * Log config-related action (for admin operations)
   */
  async logConfig(
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log(action, { type: entityType, id: entityId }, metadata);

    // Also log to ConfigAuditLog for config-specific tracking
    try {
      await prisma.configAuditLog.create({
        data: {
          clientId: this.ctx.tenantId,
          entityType,
          entityId,
          action,
          actorId: this.ctx.userId,
          previousValue: metadata?.previousValue
            ? JSON.stringify(metadata.previousValue)
            : null,
          newValue: metadata?.newValue
            ? JSON.stringify(metadata.newValue)
            : null,
          effectiveAt: metadata?.effectiveAt as Date | undefined,
        },
      });
    } catch (error) {
      console.error("[EliteAudit] Failed to log config action:", error);
    }
  }
}

/**
 * Create an audit logger for the given context
 */
export function createAudit(ctx: EliteContext): EliteAudit {
  return new EliteAudit(ctx);
}

/**
 * Log an action without context (for system operations)
 */
export async function logSystemAction(
  action: string,
  target: { type: string; id: string },
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: "SYSTEM",
        actorRole: "SYSTEM",
        action: `ELITE_${action}`,
        targetId: target.id,
        targetType: target.type,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error("[EliteAudit] Failed to log system action:", error);
  }
}

