/**
 * ELITE Enrollment Service
 *
 * Manages learner enrollment in courses with cohort association.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "../kernel/types";
import { ElitePolicy } from "../kernel/policy";
import { EliteAudit } from "../kernel/audit";
import { EliteEventBus } from "../kernel/events";
import type { Enrollment, Course, User, Cohort } from "@prisma/client";

// ============================================
// Types
// ============================================

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "WITHDRAWN";

export interface CreateEnrollmentInput {
  courseId: string;
  userId: string;
  cohortId?: string;
}

export interface BulkEnrollmentInput {
  courseId: string;
  userIds: string[];
  cohortId?: string;
}

export interface EnrollmentWithDetails extends Enrollment {
  course: Course;
  user: User;
  cohort: Cohort | null;
}

export interface EnrollmentFilters {
  courseId?: string;
  cohortId?: string;
  userId?: string;
  status?: EnrollmentStatus;
}

// ============================================
// Enrollment Operations
// ============================================

/**
 * List enrollments with optional filters
 */
export async function listEnrollments(
  ctx: EliteContext,
  filters?: EnrollmentFilters
): Promise<EnrollmentWithDetails[]> {
  const policy = new ElitePolicy(ctx);

  const where: Record<string, unknown> = {
    ...policy.tenantWhere(),
    ...(filters?.courseId && { courseId: filters.courseId }),
    ...(filters?.cohortId && { cohortId: filters.cohortId }),
    ...(filters?.userId && { userId: filters.userId }),
    ...(filters?.status && { status: filters.status }),
  };

  return prisma.enrollment.findMany({
    where,
    include: {
      course: true,
      user: true,
      cohort: true,
    },
    orderBy: { enrolledAt: "desc" },
  });
}

/**
 * Get an enrollment by ID
 */
export async function getEnrollmentById(
  ctx: EliteContext,
  enrollmentId: string
): Promise<EnrollmentWithDetails | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      ...policy.tenantWhere(),
    },
    include: {
      course: true,
      user: true,
      cohort: true,
    },
  });
}

/**
 * Get enrollment for a specific user and course
 */
export async function getEnrollmentByUserAndCourse(
  ctx: EliteContext,
  userId: string,
  courseId: string
): Promise<EnrollmentWithDetails | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      ...policy.tenantWhere(),
    },
    include: {
      course: true,
      user: true,
      cohort: true,
    },
  });
}

/**
 * Enroll a learner in a course
 */
export async function enrollLearner(
  ctx: EliteContext,
  data: CreateEnrollmentInput
): Promise<Enrollment> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_ENROLLMENTS");

  const audit = new EliteAudit(ctx);
  const events = new EliteEventBus(ctx);

  // Verify course exists and is published
  const course = await prisma.course.findFirst({
    where: {
      id: data.courseId,
      ...policy.tenantWhere(),
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.status !== "PUBLISHED") {
    throw new Error("Cannot enroll in unpublished course");
  }

  // Verify user exists and belongs to tenant
  const user = await prisma.user.findFirst({
    where: {
      id: data.userId,
      clientId: ctx.tenantId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify cohort if provided
  if (data.cohortId) {
    const cohort = await prisma.cohort.findFirst({
      where: {
        id: data.cohortId,
        ...policy.tenantWhere(),
      },
    });

    if (!cohort) {
      throw new Error("Cohort not found");
    }
  }

  // Check for existing enrollment
  const existing = await prisma.enrollment.findFirst({
    where: {
      userId: data.userId,
      courseId: data.courseId,
      ...policy.tenantWhere(),
    },
  });

  if (existing) {
    throw new Error("User is already enrolled in this course");
  }

  // Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      clientId: ctx.tenantId,
      courseId: data.courseId,
      userId: data.userId,
      cohortId: data.cohortId,
      status: "ACTIVE",
    },
  });

  await audit.log("ENROLLMENT_CREATED", { type: "Enrollment", id: enrollment.id }, { userId: enrollment.userId, courseId: enrollment.courseId });
  await events.emit({
    eventType: "LEARNER_ENROLLED",
    entityType: "Enrollment",
    entityId: enrollment.id,
    data: {
      courseId: enrollment.courseId,
      userId: enrollment.userId,
      cohortId: enrollment.cohortId,
    },
  });

  return enrollment;
}

/**
 * Bulk enroll multiple learners in a course
 */
export async function bulkEnrollLearners(
  ctx: EliteContext,
  data: BulkEnrollmentInput
): Promise<{ enrolled: string[]; skipped: string[]; errors: { userId: string; error: string }[] }> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_ENROLLMENTS");

  const audit = new EliteAudit(ctx);
  const events = new EliteEventBus(ctx);

  // Verify course exists and is published
  const course = await prisma.course.findFirst({
    where: {
      id: data.courseId,
      ...policy.tenantWhere(),
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.status !== "PUBLISHED") {
    throw new Error("Cannot enroll in unpublished course");
  }

  // Verify cohort if provided
  if (data.cohortId) {
    const cohort = await prisma.cohort.findFirst({
      where: {
        id: data.cohortId,
        ...policy.tenantWhere(),
      },
    });

    if (!cohort) {
      throw new Error("Cohort not found");
    }
  }

  // Get existing enrollments
  const existingEnrollments = await prisma.enrollment.findMany({
    where: {
      courseId: data.courseId,
      userId: { in: data.userIds },
      ...policy.tenantWhere(),
    },
  });

  const existingUserIds = new Set(existingEnrollments.map((e) => e.userId));

  // Verify users exist
  const users = await prisma.user.findMany({
    where: {
      id: { in: data.userIds },
      clientId: ctx.tenantId,
    },
  });

  const validUserIds = new Set(users.map((u) => u.id));

  const enrolled: string[] = [];
  const skipped: string[] = [];
  const errors: { userId: string; error: string }[] = [];

  for (const userId of data.userIds) {
    if (existingUserIds.has(userId)) {
      skipped.push(userId);
      continue;
    }

    if (!validUserIds.has(userId)) {
      errors.push({ userId, error: "User not found" });
      continue;
    }

    try {
      const enrollment = await prisma.enrollment.create({
        data: {
          clientId: ctx.tenantId,
          courseId: data.courseId,
          userId,
          cohortId: data.cohortId,
          status: "ACTIVE",
        },
      });

      enrolled.push(userId);

      await events.emit({
        eventType: "LEARNER_ENROLLED",
        entityType: "Enrollment",
        entityId: enrollment.id,
        data: {
          courseId: enrollment.courseId,
          userId: enrollment.userId,
          cohortId: enrollment.cohortId,
        },
      });
    } catch (error) {
      errors.push({ userId, error: (error as Error).message });
    }
  }

  await audit.log("BULK_ENROLLMENT", { type: "Course", id: data.courseId }, {
    enrolled: enrolled.length,
    skipped: skipped.length,
    errors: errors.length,
  });

  return { enrolled, skipped, errors };
}

/**
 * Withdraw a learner from a course
 */
export async function withdrawLearner(
  ctx: EliteContext,
  enrollmentId: string
): Promise<Enrollment> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_ENROLLMENTS");

  const audit = new EliteAudit(ctx);
  const events = new EliteEventBus(ctx);

  const existing = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Enrollment not found");
  }

  if (existing.status === "WITHDRAWN") {
    throw new Error("Learner is already withdrawn");
  }

  const enrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: "WITHDRAWN",
    },
  });

  await audit.log("ENROLLMENT_WITHDRAWN", { type: "Enrollment", id: enrollment.id }, { userId: enrollment.userId, courseId: enrollment.courseId });
  await events.emit({
    eventType: "LEARNER_WITHDRAWN",
    entityType: "Enrollment",
    entityId: enrollment.id,
    data: {
      courseId: enrollment.courseId,
      userId: enrollment.userId,
    },
  });

  return enrollment;
}

/**
 * Reactivate a withdrawn learner
 */
export async function reactivateLearner(
  ctx: EliteContext,
  enrollmentId: string
): Promise<Enrollment> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_ENROLLMENTS");

  const audit = new EliteAudit(ctx);

  const existing = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Enrollment not found");
  }

  if (existing.status !== "WITHDRAWN") {
    throw new Error("Learner is not withdrawn");
  }

  const enrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: "ACTIVE",
    },
  });

  await audit.log("ENROLLMENT_REACTIVATED", { type: "Enrollment", id: enrollment.id }, { userId: enrollment.userId, courseId: enrollment.courseId });

  return enrollment;
}

/**
 * Get learner's enrollments
 */
export async function getMyEnrollments(
  ctx: EliteContext
): Promise<EnrollmentWithDetails[]> {
  const policy = new ElitePolicy(ctx);

  return prisma.enrollment.findMany({
    where: {
      userId: ctx.userId,
      ...policy.tenantWhere(),
    },
    include: {
      course: true,
      user: true,
      cohort: true,
    },
    orderBy: { enrolledAt: "desc" },
  });
}

/**
 * Get active enrollment for current user in a course
 */
export async function getMyEnrollmentForCourse(
  ctx: EliteContext,
  courseId: string
): Promise<EnrollmentWithDetails | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.enrollment.findFirst({
    where: {
      userId: ctx.userId,
      courseId,
      status: "ACTIVE",
      ...policy.tenantWhere(),
    },
    include: {
      course: true,
      user: true,
      cohort: true,
    },
  });
}

/**
 * Get enrollment statistics for a course
 */
export async function getCourseEnrollmentStats(
  ctx: EliteContext,
  courseId: string
): Promise<{
  total: number;
  active: number;
  completed: number;
  withdrawn: number;
}> {
  const policy = new ElitePolicy(ctx);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      ...policy.tenantWhere(),
    },
    select: {
      status: true,
    },
  });

  return {
    total: enrollments.length,
    active: enrollments.filter((e) => e.status === "ACTIVE").length,
    completed: enrollments.filter((e) => e.status === "COMPLETED").length,
    withdrawn: enrollments.filter((e) => e.status === "WITHDRAWN").length,
  };
}

/**
 * Get enrollment statistics for a cohort
 */
export async function getCohortEnrollmentStats(
  ctx: EliteContext,
  cohortId: string
): Promise<{
  total: number;
  active: number;
  completed: number;
  withdrawn: number;
}> {
  const policy = new ElitePolicy(ctx);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      cohortId,
      ...policy.tenantWhere(),
    },
    select: {
      status: true,
    },
  });

  return {
    total: enrollments.length,
    active: enrollments.filter((e) => e.status === "ACTIVE").length,
    completed: enrollments.filter((e) => e.status === "COMPLETED").length,
    withdrawn: enrollments.filter((e) => e.status === "WITHDRAWN").length,
  };
}

// Export as a service object
export const enrollmentService = {
  // Queries
  listEnrollments,
  getEnrollmentById,
  getEnrollmentByUserAndCourse,
  getMyEnrollments,
  getMyEnrollmentForCourse,
  getCourseEnrollmentStats,
  getCohortEnrollmentStats,

  // Mutations
  enrollLearner,
  bulkEnrollLearners,
  withdrawLearner,
  reactivateLearner,
};

