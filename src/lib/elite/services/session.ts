/**
 * Session Service
 * 
 * Business logic for session management.
 * All methods enforce tenant boundaries and emit events.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "../kernel/types";
import { createPolicy } from "../kernel/policy";
import { createAudit } from "../kernel/audit";
import { createEventBus, ELITE_EVENT_TYPES } from "../kernel/events";
import { ELITE_PERMISSIONS } from "../permissions";

// Types
export interface CreateSessionInput {
  cohortId: string;
  title: string;
  description?: string;
  agenda?: string;
  scheduledAt: Date;
  timezone?: string;
  duration: number; // minutes
  zoomUrl?: string;
}

export interface UpdateSessionInput {
  title?: string;
  description?: string;
  agenda?: string;
  scheduledAt?: Date;
  timezone?: string;
  duration?: number;
  zoomUrl?: string;
  status?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export interface RecordAttendanceInput {
  userId: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
  auditNote?: string;
}

export interface SessionWithDetails {
  id: string;
  title: string;
  description: string | null;
  agenda: string | null;
  scheduledAt: Date;
  timezone: string;
  duration: number;
  zoomUrl: string | null;
  calendarEventId: string | null;
  status: string;
  host: {
    id: string;
    name: string;
    email: string;
  };
  cohort: {
    id: string;
    name: string;
  };
  _count: {
    attendance: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session Service implementation
 */
class SessionService {
  /**
   * List sessions for cohorts the user has access to
   */
  async list(ctx: EliteContext, filters?: { cohortId?: string }): Promise<SessionWithDetails[]> {
    const policy = createPolicy(ctx);
    
    const where: Record<string, unknown> = {
      ...policy.tenantWhere(),
    };

    // Filter by cohort if specified
    if (filters?.cohortId) {
      if (!policy.canAccessCohort(filters.cohortId)) {
        throw new Error("Access denied to cohort");
      }
      where.cohortId = filters.cohortId;
    } else {
      // Filter by accessible cohorts
      const cohortWhere = policy.cohortMemberWhere();
      if (cohortWhere.cohortId) {
        where.cohortId = cohortWhere.cohortId;
      }
    }

    const sessions = await (prisma as any).eliteSession.findMany({
      where,
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        cohort: {
          select: { id: true, name: true },
        },
        _count: {
          select: { attendance: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return sessions;
  }

  /**
   * Get upcoming sessions
   */
  async listUpcoming(ctx: EliteContext, limit: number = 10): Promise<SessionWithDetails[]> {
    const policy = createPolicy(ctx);
    
    const where: Record<string, unknown> = {
      ...policy.tenantWhere(),
      scheduledAt: { gte: new Date() },
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    };

    // Filter by accessible cohorts
    const cohortWhere = policy.cohortMemberWhere();
    if (cohortWhere.cohortId) {
      where.cohortId = cohortWhere.cohortId;
    }

    const sessions = await (prisma as any).eliteSession.findMany({
      where,
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        cohort: {
          select: { id: true, name: true },
        },
        _count: {
          select: { attendance: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });

    return sessions;
  }

  /**
   * Get a single session by ID
   */
  async getById(ctx: EliteContext, id: string): Promise<SessionWithDetails | null> {
    const policy = createPolicy(ctx);

    const session = await (prisma as any).eliteSession.findFirst({
      where: {
        ...policy.tenantWhere(),
        id,
      },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        cohort: {
          select: { id: true, name: true },
        },
        _count: {
          select: { attendance: true },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check cohort access
    if (!policy.canAccessCohort(session.cohortId)) {
      return null;
    }

    return session;
  }

  /**
   * Create a new session
   */
  async create(ctx: EliteContext, input: CreateSessionInput): Promise<SessionWithDetails> {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);
    const events = createEventBus(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.MANAGE_SESSIONS)) {
      throw new Error("Permission denied: MANAGE_SESSIONS required");
    }

    // Verify cohort exists and user has access
    const cohort = await (prisma as any).cohort.findFirst({
      where: {
        ...policy.tenantWhere(),
        id: input.cohortId,
      },
    });

    if (!cohort) {
      throw new Error("Cohort not found");
    }

    // Create session with current user as host
    const session = await (prisma as any).eliteSession.create({
      data: {
        clientId: ctx.tenantId,
        cohortId: input.cohortId,
        title: input.title,
        description: input.description,
        agenda: input.agenda,
        hostUserId: ctx.userId,
        scheduledAt: input.scheduledAt,
        timezone: input.timezone ?? cohort.timezone ?? "UTC",
        duration: input.duration,
        zoomUrl: input.zoomUrl,
        status: "SCHEDULED",
      },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        cohort: {
          select: { id: true, name: true },
        },
        _count: {
          select: { attendance: true },
        },
      },
    });

    // Audit and event
    await audit.logSession("CREATED", session.id, {
      title: input.title,
      cohortId: input.cohortId,
    });
    await events.emitSessionScheduled(session.id, input.cohortId, input.scheduledAt);

    return session;
  }

  /**
   * Update a session
   */
  async update(
    ctx: EliteContext,
    id: string,
    input: UpdateSessionInput
  ): Promise<SessionWithDetails> {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.MANAGE_SESSIONS)) {
      throw new Error("Permission denied: MANAGE_SESSIONS required");
    }

    // Verify session exists and belongs to tenant
    const existing = await (prisma as any).eliteSession.findFirst({
      where: {
        ...policy.tenantWhere(),
        id,
      },
    });

    if (!existing) {
      throw new Error("Session not found");
    }

    // Update
    const session = await (prisma as any).eliteSession.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        agenda: input.agenda,
        scheduledAt: input.scheduledAt,
        timezone: input.timezone,
        duration: input.duration,
        zoomUrl: input.zoomUrl,
        status: input.status,
      },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        cohort: {
          select: { id: true, name: true },
        },
        _count: {
          select: { attendance: true },
        },
      },
    });

    await audit.logSession("UPDATED", id, { changes: input });

    return session;
  }

  /**
   * Cancel a session
   */
  async cancel(ctx: EliteContext, id: string): Promise<void> {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.MANAGE_SESSIONS)) {
      throw new Error("Permission denied: MANAGE_SESSIONS required");
    }

    // Verify session exists
    const existing = await (prisma as any).eliteSession.findFirst({
      where: {
        ...policy.tenantWhere(),
        id,
      },
    });

    if (!existing) {
      throw new Error("Session not found");
    }

    await (prisma as any).eliteSession.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await audit.logSession("CANCELLED", id);
  }

  // ============================================
  // Attendance Management
  // ============================================

  /**
   * Get attendance for a session
   */
  async getAttendance(ctx: EliteContext, sessionId: string) {
    const policy = createPolicy(ctx);

    // Get session first to verify access
    const session = await this.getById(ctx, sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const attendance = await (prisma as any).sessionAttendance.findMany({
      where: {
        ...policy.tenantWhere(),
        sessionId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return attendance;
  }

  /**
   * Record attendance for a user
   */
  async recordAttendance(
    ctx: EliteContext,
    sessionId: string,
    input: RecordAttendanceInput
  ) {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);
    const events = createEventBus(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.RECORD_ATTENDANCE)) {
      throw new Error("Permission denied: RECORD_ATTENDANCE required");
    }

    // Verify session exists
    const session = await (prisma as any).eliteSession.findFirst({
      where: {
        ...policy.tenantWhere(),
        id: sessionId,
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Upsert attendance record
    const attendance = await (prisma as any).sessionAttendance.upsert({
      where: {
        clientId_sessionId_userId: {
          clientId: ctx.tenantId,
          sessionId,
          userId: input.userId,
        },
      },
      create: {
        clientId: ctx.tenantId,
        sessionId,
        userId: input.userId,
        status: input.status,
        auditNote: input.auditNote,
        recordedBy: ctx.userId,
      },
      update: {
        status: input.status,
        auditNote: input.auditNote,
        recordedBy: ctx.userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await audit.logSession("ATTENDANCE_RECORDED", sessionId, {
      userId: input.userId,
      status: input.status,
    });
    await events.emitAttendanceRecorded(
      attendance.id,
      sessionId,
      input.userId,
      input.status
    );

    return attendance;
  }

  /**
   * Bulk record attendance
   */
  async recordBulkAttendance(
    ctx: EliteContext,
    sessionId: string,
    records: RecordAttendanceInput[]
  ) {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.RECORD_ATTENDANCE)) {
      throw new Error("Permission denied: RECORD_ATTENDANCE required");
    }

    // Verify session exists
    const session = await (prisma as any).eliteSession.findFirst({
      where: {
        ...policy.tenantWhere(),
        id: sessionId,
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Record each attendance
    const results = [];
    for (const record of records) {
      const attendance = await (prisma as any).sessionAttendance.upsert({
        where: {
          clientId_sessionId_userId: {
            clientId: ctx.tenantId,
            sessionId,
            userId: record.userId,
          },
        },
        create: {
          clientId: ctx.tenantId,
          sessionId,
          userId: record.userId,
          status: record.status,
          auditNote: record.auditNote,
          recordedBy: ctx.userId,
        },
        update: {
          status: record.status,
          auditNote: record.auditNote,
          recordedBy: ctx.userId,
        },
      });
      results.push(attendance);
    }

    await audit.logSession("BULK_ATTENDANCE_RECORDED", sessionId, {
      count: records.length,
    });

    return results;
  }
}

// Export singleton instance
export const sessionService = new SessionService();

