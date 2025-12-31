/**
 * Cohort Service
 * 
 * Business logic for cohort management.
 * All methods enforce tenant boundaries and emit events.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "../kernel/types";
import { ElitePolicy, createPolicy } from "../kernel/policy";
import { createAudit } from "../kernel/audit";
import { createEventBus, ELITE_EVENT_TYPES } from "../kernel/events";
import { ELITE_PERMISSIONS } from "../permissions";

// Types for service input/output
export interface CreateCohortInput {
  name: string;
  programTemplateId: string;
  orgUnitId?: string;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
}

export interface UpdateCohortInput {
  name?: string;
  status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
}

export interface AddMemberInput {
  userId: string;
  role: "LEARNER" | "COACH" | "INSTRUCTOR";
}

export interface CohortWithCounts {
  id: string;
  name: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  timezone: string;
  programTemplate: {
    id: string;
    name: string;
  };
  orgUnit: {
    id: string;
    name: string;
  } | null;
  _count: {
    members: number;
    sessions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cohort Service implementation
 */
class CohortService {
  /**
   * List cohorts the user has access to
   */
  async list(ctx: EliteContext): Promise<CohortWithCounts[]> {
    const policy = createPolicy(ctx);
    
    // Use cohortWhere to filter by access
    const where = policy.cohortWhere();
    
    const cohorts = await (prisma as any).cohort.findMany({
      where,
      include: {
        programTemplate: {
          select: { id: true, name: true },
        },
        orgUnit: {
          select: { id: true, name: true },
        },
        _count: {
          select: { members: true, sessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return cohorts;
  }

  /**
   * Get a single cohort by ID
   */
  async getById(ctx: EliteContext, id: string): Promise<CohortWithCounts | null> {
    const policy = createPolicy(ctx);

    const cohort = await (prisma as any).cohort.findFirst({
      where: {
        ...policy.tenantWhere(),
        id,
      },
      include: {
        programTemplate: {
          select: { id: true, name: true },
        },
        orgUnit: {
          select: { id: true, name: true },
        },
        _count: {
          select: { members: true, sessions: true },
        },
      },
    });

    if (!cohort) {
      return null;
    }

    // Check cohort access
    if (!policy.canAccessCohort(id)) {
      return null;
    }

    return cohort;
  }

  /**
   * Create a new cohort
   */
  async create(ctx: EliteContext, input: CreateCohortInput): Promise<CohortWithCounts> {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);
    const events = createEventBus(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.MANAGE_COHORTS)) {
      throw new Error("Permission denied: MANAGE_COHORTS required");
    }

    // Validate program template exists and belongs to tenant
    const template = await (prisma as any).programTemplate.findFirst({
      where: {
        ...policy.tenantWhere(),
        id: input.programTemplateId,
      },
    });

    if (!template) {
      throw new Error("Program template not found");
    }

    // Create cohort
    const cohort = await (prisma as any).cohort.create({
      data: {
        clientId: ctx.tenantId,
        name: input.name,
        programTemplateId: input.programTemplateId,
        orgUnitId: input.orgUnitId ?? ctx.orgUnitId,
        startDate: input.startDate,
        endDate: input.endDate,
        timezone: input.timezone ?? "UTC",
        status: "DRAFT",
      },
      include: {
        programTemplate: {
          select: { id: true, name: true },
        },
        orgUnit: {
          select: { id: true, name: true },
        },
        _count: {
          select: { members: true, sessions: true },
        },
      },
    });

    // Audit and event
    await audit.logCohort("CREATED", cohort.id, { name: input.name });
    await events.emitCohortCreated(cohort.id, {
      name: cohort.name,
      programTemplateId: cohort.programTemplateId,
      orgUnitId: cohort.orgUnitId,
    });

    return cohort;
  }

  /**
   * Update a cohort
   */
  async update(
    ctx: EliteContext,
    id: string,
    input: UpdateCohortInput
  ): Promise<CohortWithCounts> {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);
    const events = createEventBus(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.MANAGE_COHORTS)) {
      throw new Error("Permission denied: MANAGE_COHORTS required");
    }

    // Get existing cohort
    const existing = await (prisma as any).cohort.findFirst({
      where: {
        ...policy.tenantWhere(),
        id,
      },
    });

    if (!existing) {
      throw new Error("Cohort not found");
    }

    // Update
    const cohort = await (prisma as any).cohort.update({
      where: { id },
      data: {
        name: input.name,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        timezone: input.timezone,
      },
      include: {
        programTemplate: {
          select: { id: true, name: true },
        },
        orgUnit: {
          select: { id: true, name: true },
        },
        _count: {
          select: { members: true, sessions: true },
        },
      },
    });

    // Emit status change event if status changed
    if (input.status && input.status !== existing.status) {
      await events.emitCohortStatusChanged(id, existing.status, input.status);
    }

    await audit.logCohort("UPDATED", id, { changes: input });

    return cohort;
  }

  /**
   * Delete (archive) a cohort
   */
  async delete(ctx: EliteContext, id: string): Promise<void> {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.MANAGE_COHORTS)) {
      throw new Error("Permission denied: MANAGE_COHORTS required");
    }

    // Verify cohort exists and belongs to tenant
    const existing = await (prisma as any).cohort.findFirst({
      where: {
        ...policy.tenantWhere(),
        id,
      },
    });

    if (!existing) {
      throw new Error("Cohort not found");
    }

    // Soft delete by setting status to ARCHIVED
    await (prisma as any).cohort.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await audit.logCohort("ARCHIVED", id);
  }

  // ============================================
  // Member Management
  // ============================================

  /**
   * List members of a cohort
   */
  async listMembers(ctx: EliteContext, cohortId: string) {
    const policy = createPolicy(ctx);

    // Verify cohort access
    if (!policy.canAccessCohort(cohortId)) {
      throw new Error("Access denied to cohort");
    }

    const members = await (prisma as any).cohortMember.findMany({
      where: {
        ...policy.tenantWhere(),
        cohortId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });

    return members;
  }

  /**
   * Add a member to a cohort
   */
  async addMember(
    ctx: EliteContext,
    cohortId: string,
    input: AddMemberInput
  ) {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);
    const events = createEventBus(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.MANAGE_ROSTER)) {
      throw new Error("Permission denied: MANAGE_ROSTER required");
    }

    // Verify cohort exists
    const cohort = await (prisma as any).cohort.findFirst({
      where: {
        ...policy.tenantWhere(),
        id: cohortId,
      },
    });

    if (!cohort) {
      throw new Error("Cohort not found");
    }

    // Verify user exists and belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: input.userId,
        clientId: ctx.tenantId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already a member
    const existing = await (prisma as any).cohortMember.findFirst({
      where: {
        clientId: ctx.tenantId,
        cohortId,
        userId: input.userId,
      },
    });

    if (existing) {
      throw new Error("User is already a member of this cohort");
    }

    // Add member
    const member = await (prisma as any).cohortMember.create({
      data: {
        clientId: ctx.tenantId,
        cohortId,
        userId: input.userId,
        role: input.role,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await audit.logCohort("MEMBER_ADDED", cohortId, {
      userId: input.userId,
      role: input.role,
    });
    await events.emitMemberAdded(cohortId, member.id, input.role);

    return member;
  }

  /**
   * Remove a member from a cohort
   */
  async removeMember(
    ctx: EliteContext,
    cohortId: string,
    userId: string
  ): Promise<void> {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.MANAGE_ROSTER)) {
      throw new Error("Permission denied: MANAGE_ROSTER required");
    }

    // Find membership
    const membership = await (prisma as any).cohortMember.findFirst({
      where: {
        ...policy.tenantWhere(),
        cohortId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Member not found");
    }

    // Update status to WITHDRAWN instead of deleting
    await (prisma as any).cohortMember.update({
      where: { id: membership.id },
      data: { status: "WITHDRAWN" },
    });

    await audit.logCohort("MEMBER_REMOVED", cohortId, { userId });
  }

  /**
   * Import members from CSV data
   */
  async importMembers(
    ctx: EliteContext,
    cohortId: string,
    members: Array<{ email: string; role: "LEARNER" | "COACH" | "INSTRUCTOR" }>
  ): Promise<{ added: number; skipped: number; errors: string[] }> {
    const policy = createPolicy(ctx);
    const audit = createAudit(ctx);

    // Permission check
    if (!policy.can(ELITE_PERMISSIONS.MANAGE_ROSTER)) {
      throw new Error("Permission denied: MANAGE_ROSTER required");
    }

    // Verify cohort exists
    const cohort = await (prisma as any).cohort.findFirst({
      where: {
        ...policy.tenantWhere(),
        id: cohortId,
      },
    });

    if (!cohort) {
      throw new Error("Cohort not found");
    }

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const member of members) {
      try {
        // Find user by email in tenant
        const user = await prisma.user.findFirst({
          where: {
            email: member.email.toLowerCase(),
            clientId: ctx.tenantId,
          },
        });

        if (!user) {
          errors.push(`User not found: ${member.email}`);
          continue;
        }

        // Check if already a member
        const existing = await (prisma as any).cohortMember.findFirst({
          where: {
            clientId: ctx.tenantId,
            cohortId,
            userId: user.id,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Add member
        await (prisma as any).cohortMember.create({
          data: {
            clientId: ctx.tenantId,
            cohortId,
            userId: user.id,
            role: member.role,
            status: "ACTIVE",
          },
        });

        added++;
      } catch (err) {
        errors.push(`Error adding ${member.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    await audit.logCohort("MEMBERS_IMPORTED", cohortId, {
      added,
      skipped,
      errorCount: errors.length,
    });

    return { added, skipped, errors };
  }
}

// Export singleton instance
export const cohortService = new CohortService();

