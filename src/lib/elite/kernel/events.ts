/**
 * ELITE Event Bus
 * 
 * Emits domain events for the analytics pipeline.
 * Events are stored in EliteEvent with dual timestamps for late-arriving event handling.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "./types";
import type { EliteEvent } from "./types";

/**
 * Event types for the ELITE domain
 */
export const ELITE_EVENT_TYPES = {
  // Cohort events
  COHORT_CREATED: "COHORT_CREATED",
  COHORT_UPDATED: "COHORT_UPDATED",
  COHORT_STATUS_CHANGED: "COHORT_STATUS_CHANGED",
  COHORT_ARCHIVED: "COHORT_ARCHIVED",

  // Member events
  MEMBER_ADDED: "MEMBER_ADDED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
  MEMBER_ROLE_CHANGED: "MEMBER_ROLE_CHANGED",

  // Session events
  SESSION_SCHEDULED: "SESSION_SCHEDULED",
  SESSION_UPDATED: "SESSION_UPDATED",
  SESSION_CANCELLED: "SESSION_CANCELLED",
  SESSION_COMPLETED: "SESSION_COMPLETED",

  // Attendance events
  ATTENDANCE_RECORDED: "ATTENDANCE_RECORDED",
  ATTENDANCE_UPDATED: "ATTENDANCE_UPDATED",

  // Coaching events
  COACHING_NOTE_CREATED: "COACHING_NOTE_CREATED",
  COACHING_NOTE_UPDATED: "COACHING_NOTE_UPDATED",
  ACTION_PLAN_CREATED: "ACTION_PLAN_CREATED",
  ACTION_PLAN_UPDATED: "ACTION_PLAN_UPDATED",
  ACTION_PLAN_COMPLETED: "ACTION_PLAN_COMPLETED",

  // Task events
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_COMPLETED: "TASK_COMPLETED",

  // Artifact events
  ARTIFACT_UPLOADED: "ARTIFACT_UPLOADED",
  ARTIFACT_UPDATED: "ARTIFACT_UPDATED",
  ARTIFACT_DELETED: "ARTIFACT_DELETED",

  // Assignment events
  ASSIGNMENT_CREATED: "ASSIGNMENT_CREATED",
  ASSIGNMENT_UPDATED: "ASSIGNMENT_UPDATED",
  SUBMISSION_CREATED: "SUBMISSION_CREATED",
  SUBMISSION_GRADED: "SUBMISSION_GRADED",

  // Messaging events
  MESSAGE_SENT: "MESSAGE_SENT",
  ANNOUNCEMENT_SENT: "ANNOUNCEMENT_SENT",

  // Template events
  TEMPLATE_CREATED: "TEMPLATE_CREATED",
  TEMPLATE_PUBLISHED: "TEMPLATE_PUBLISHED",
  TEMPLATE_ARCHIVED: "TEMPLATE_ARCHIVED",

  // Profile events
  PROFILE_UPDATED: "PROFILE_UPDATED",
  PROFILE_VERSION_PUBLISHED: "PROFILE_VERSION_PUBLISHED",
} as const;

export type EliteEventType = (typeof ELITE_EVENT_TYPES)[keyof typeof ELITE_EVENT_TYPES];

/**
 * Current schema version for events
 * Increment when event data structure changes
 */
const CURRENT_SCHEMA_VERSION = 1;

/**
 * ELITE Event Bus for emitting domain events
 */
export class EliteEventBus {
  constructor(private ctx: EliteContext) {}

  /**
   * Emit a domain event
   */
  async emit(event: Omit<EliteEvent, "eventTs" | "schemaVersion">): Promise<void> {
    try {
      await prisma.eliteEvent.create({
        data: {
          clientId: this.ctx.tenantId,
          eventType: event.eventType,
          entityType: event.entityType,
          entityId: event.entityId,
          eventTs: new Date(), // Source timestamp
          schemaVersion: CURRENT_SCHEMA_VERSION,
          eventData: JSON.stringify(event.data),
          actorId: event.actorId ?? this.ctx.userId,
          actorRole: event.actorRole ?? this.ctx.eliteRole,
        },
      });
    } catch (error) {
      // Log but don't fail - events are for analytics, not critical path
      console.error("[EliteEventBus] Failed to emit event:", error);
    }
  }

  /**
   * Emit with explicit source timestamp (for imported/delayed events)
   */
  async emitWithTimestamp(
    event: Omit<EliteEvent, "schemaVersion">,
    sourceTimestamp: Date
  ): Promise<void> {
    try {
      await prisma.eliteEvent.create({
        data: {
          clientId: this.ctx.tenantId,
          eventType: event.eventType,
          entityType: event.entityType,
          entityId: event.entityId,
          eventTs: sourceTimestamp,
          schemaVersion: CURRENT_SCHEMA_VERSION,
          eventData: JSON.stringify(event.data),
          actorId: event.actorId ?? this.ctx.userId,
          actorRole: event.actorRole ?? this.ctx.eliteRole,
        },
      });
    } catch (error) {
      console.error("[EliteEventBus] Failed to emit event with timestamp:", error);
    }
  }

  // ============================================
  // Convenience methods for common events
  // ============================================

  async emitCohortCreated(cohortId: string, data: Record<string, unknown>): Promise<void> {
    await this.emit({
      eventType: ELITE_EVENT_TYPES.COHORT_CREATED,
      entityType: "Cohort",
      entityId: cohortId,
      data,
    });
  }

  async emitCohortStatusChanged(
    cohortId: string,
    previousStatus: string,
    newStatus: string
  ): Promise<void> {
    await this.emit({
      eventType: ELITE_EVENT_TYPES.COHORT_STATUS_CHANGED,
      entityType: "Cohort",
      entityId: cohortId,
      data: { previousStatus, newStatus },
    });
  }

  async emitMemberAdded(
    cohortId: string,
    memberId: string,
    role: string
  ): Promise<void> {
    await this.emit({
      eventType: ELITE_EVENT_TYPES.MEMBER_ADDED,
      entityType: "CohortMember",
      entityId: memberId,
      data: { cohortId, role },
    });
  }

  async emitSessionScheduled(
    sessionId: string,
    cohortId: string,
    scheduledAt: Date
  ): Promise<void> {
    await this.emit({
      eventType: ELITE_EVENT_TYPES.SESSION_SCHEDULED,
      entityType: "EliteSession",
      entityId: sessionId,
      data: { cohortId, scheduledAt: scheduledAt.toISOString() },
    });
  }

  async emitAttendanceRecorded(
    attendanceId: string,
    sessionId: string,
    userId: string,
    status: string
  ): Promise<void> {
    await this.emit({
      eventType: ELITE_EVENT_TYPES.ATTENDANCE_RECORDED,
      entityType: "SessionAttendance",
      entityId: attendanceId,
      data: { sessionId, userId, status },
    });
  }

  async emitCoachingNoteCreated(
    noteId: string,
    cohortId: string,
    learnerId: string
  ): Promise<void> {
    await this.emit({
      eventType: ELITE_EVENT_TYPES.COACHING_NOTE_CREATED,
      entityType: "CoachingNote",
      entityId: noteId,
      data: { cohortId, learnerId },
    });
  }

  async emitSubmissionCreated(
    submissionId: string,
    assignmentId: string,
    learnerId: string
  ): Promise<void> {
    await this.emit({
      eventType: ELITE_EVENT_TYPES.SUBMISSION_CREATED,
      entityType: "Submission",
      entityId: submissionId,
      data: { assignmentId, learnerId },
    });
  }

  async emitAnnouncementSent(
    messageId: string,
    cohortId: string,
    recipientCount: number
  ): Promise<void> {
    await this.emit({
      eventType: ELITE_EVENT_TYPES.ANNOUNCEMENT_SENT,
      entityType: "Message",
      entityId: messageId,
      data: { cohortId, recipientCount },
    });
  }
}

/**
 * Create an event bus for the given context
 */
export function createEventBus(ctx: EliteContext): EliteEventBus {
  return new EliteEventBus(ctx);
}

/**
 * Emit a system event (no user context)
 */
export async function emitSystemEvent(
  clientId: string,
  event: Omit<EliteEvent, "eventTs" | "schemaVersion" | "actorId" | "actorRole">
): Promise<void> {
  try {
    await prisma.eliteEvent.create({
      data: {
        clientId,
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        eventTs: new Date(),
        schemaVersion: CURRENT_SCHEMA_VERSION,
        eventData: JSON.stringify(event.data),
        actorId: "SYSTEM",
        actorRole: "SYSTEM",
      },
    });
  } catch (error) {
    console.error("[EliteEventBus] Failed to emit system event:", error);
  }
}

