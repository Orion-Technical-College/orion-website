/**
 * ELITE Policy Checker
 * 
 * Enforces permissions and provides query guards for tenant isolation.
 * ALWAYS use these methods - never query the database without tenant guards.
 */

import type { EliteContext } from "./types";
import type { ElitePermission } from "../permissions";
import { ELITE_PERMISSIONS, ELITE_ROLES } from "../permissions";

/**
 * Policy checker for ELITE authorization
 */
export class ElitePolicy {
  constructor(private ctx: EliteContext) {}

  /**
   * Check if the user has a specific permission
   */
  can(permission: ElitePermission): boolean {
    return this.ctx.effectivePermissions.includes(permission);
  }

  /**
   * Require a specific permission, throw if not authorized
   */
  requirePermission(permission: ElitePermission): void {
    if (!this.can(permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }

  /**
   * Check if the user can access a specific cohort
   * Users can access cohorts they're members of, or all cohorts if they have MANAGE_COHORTS
   */
  canAccessCohort(cohortId: string): boolean {
    if (this.can(ELITE_PERMISSIONS.MANAGE_COHORTS)) {
      return true;
    }
    if (this.can(ELITE_PERMISSIONS.VIEW_CROSS_COHORT_ANALYTICS)) {
      return true;
    }
    return this.ctx.cohortIds.includes(cohortId);
  }

  /**
   * Check if the user can access a specific learner's data
   * Coaches can access learners in their cohorts
   * Program admins and leadership can access all learners in the tenant
   */
  canAccessLearner(learnerId: string, cohortId?: string): boolean {
    // Program admin and leadership can access all learners
    if (
      this.ctx.eliteRole === ELITE_ROLES.PROGRAM_ADMIN ||
      this.ctx.eliteRole === ELITE_ROLES.LEADERSHIP
    ) {
      return true;
    }

    // Coaches and instructors can access learners in their cohorts
    if (
      (this.ctx.eliteRole === ELITE_ROLES.COACH ||
        this.ctx.eliteRole === ELITE_ROLES.INSTRUCTOR) &&
      cohortId
    ) {
      return this.ctx.cohortIds.includes(cohortId);
    }

    // Learners can only access their own data
    return this.ctx.userId === learnerId;
  }

  /**
   * Check if a feature flag is enabled
   */
  isFeatureEnabled(flag: string): boolean {
    return this.ctx.featureFlags[flag] === true;
  }

  // ============================================
  // QUERY GUARDS - Always use these for database queries
  // ============================================

  /**
   * Tenant boundary filter - ALWAYS include in queries
   * Returns { clientId: tenantId }
   */
  tenantWhere(): { clientId: string } {
    return { clientId: this.ctx.tenantId };
  }

  /**
   * Cohort access filter
   * For users with MANAGE_COHORTS, returns tenant-only filter
   * For other users, returns filter including only their cohorts
   */
  cohortWhere(): { clientId: string; id?: { in: string[] } } {
    const base = this.tenantWhere();
    
    if (this.can(ELITE_PERMISSIONS.MANAGE_COHORTS)) {
      return base;
    }
    
    if (this.can(ELITE_PERMISSIONS.VIEW_CROSS_COHORT_ANALYTICS)) {
      return base;
    }

    return {
      ...base,
      id: { in: this.ctx.cohortIds },
    };
  }

  /**
   * Cohort membership filter for querying entities related to cohorts
   */
  cohortMemberWhere(): { clientId: string; cohortId?: { in: string[] } } {
    const base = this.tenantWhere();

    if (this.can(ELITE_PERMISSIONS.MANAGE_COHORTS)) {
      return base;
    }

    if (this.can(ELITE_PERMISSIONS.VIEW_CROSS_COHORT_ANALYTICS)) {
      return base;
    }

    return {
      ...base,
      cohortId: { in: this.ctx.cohortIds },
    };
  }

  /**
   * Org unit access filter
   * For users with MANAGE_COHORTS (program admins), returns tenant-only filter
   * For other users, returns filter including only their org units
   */
  orgWhere(): { clientId: string; orgUnitId?: { in: string[] } } {
    const base = this.tenantWhere();

    if (this.can(ELITE_PERMISSIONS.MANAGE_COHORTS)) {
      return base;
    }

    return {
      ...base,
      orgUnitId: { in: this.ctx.orgUnitIds },
    };
  }

  /**
   * Session access filter
   */
  sessionWhere(): { clientId: string; cohortId?: { in: string[] } } {
    return this.cohortMemberWhere();
  }

  /**
   * Coaching note visibility filter
   * Coaches see their own notes and notes visible to them
   * Learners only see notes marked as LEARNER_VISIBLE for themselves
   */
  coachingNoteWhere(): Record<string, unknown> {
    const base = this.tenantWhere();

    // Program admin sees all notes in tenant
    if (this.ctx.eliteRole === ELITE_ROLES.PROGRAM_ADMIN) {
      return base;
    }

    // Leadership sees non-private notes
    if (this.ctx.eliteRole === ELITE_ROLES.LEADERSHIP) {
      return {
        ...base,
        OR: [
          { visibilityScope: "LEARNER_VISIBLE" },
          { visibilityScope: "COHORT_STAFF" },
        ],
      };
    }

    // Coaches see their own notes and cohort staff notes
    if (this.ctx.eliteRole === ELITE_ROLES.COACH) {
      return {
        ...base,
        OR: [
          { coachId: this.ctx.userId },
          { visibilityScope: "COHORT_STAFF" },
        ],
      };
    }

    // Instructors see cohort staff notes
    if (this.ctx.eliteRole === ELITE_ROLES.INSTRUCTOR) {
      return {
        ...base,
        visibilityScope: "COHORT_STAFF",
      };
    }

    // Learners only see notes marked visible to them, for themselves
    return {
      ...base,
      learnerId: this.ctx.userId,
      visibilityScope: "LEARNER_VISIBLE",
    };
  }
}

/**
 * Create a policy checker for the given context
 */
export function createPolicy(ctx: EliteContext): ElitePolicy {
  return new ElitePolicy(ctx);
}

