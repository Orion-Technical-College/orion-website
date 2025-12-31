/**
 * ELITE Submission Service
 *
 * Manages assignment submissions with coach approval workflow for Demonstrate It items.
 * Supports ELITE's capstone workflow: submit → review → approve/needs revision → resubmit.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "../kernel/types";
import { ElitePolicy } from "../kernel/policy";
import { EliteAudit } from "../kernel/audit";
import { EliteEventBus } from "../kernel/events";
import { completionService } from "./completion";
import type {
  Submission,
  Assignment,
  Artifact,
  User,
  Rubric,
} from "@prisma/client";

// ============================================
// Types
// ============================================

export type SubmissionStatus = "SUBMITTED" | "NEEDS_REVISION" | "APPROVED";

export interface SubmissionWithDetails extends Submission {
  assignment: Assignment;
  learner: User;
  artifact: Artifact | null;
}

export interface AssignmentWithDetails extends Assignment {
  item: { id: string; name: string; moduleId: string } | null;
  rubric: Rubric | null;
  submissions: Submission[];
}

export interface ReviewData {
  status: "APPROVED" | "NEEDS_REVISION";
  feedback: string;
  rubricScores?: Record<string, number>; // { criterionId: score }
}

export interface SubmissionFilters {
  assignmentId?: string;
  learnerId?: string;
  status?: SubmissionStatus;
  cohortId?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
}

// ============================================
// Assignment Management
// ============================================

/**
 * Get assignment by ID
 */
export async function getAssignmentById(
  ctx: EliteContext,
  assignmentId: string
): Promise<AssignmentWithDetails | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      ...policy.tenantWhere(),
    },
    include: {
      item: {
        select: { id: true, name: true, moduleId: true },
      },
      rubric: true,
      submissions: {
        orderBy: { attemptNumber: "desc" },
      },
    },
  });
}

/**
 * List assignments for a cohort
 */
export async function listAssignments(
  ctx: EliteContext,
  cohortId: string
): Promise<AssignmentWithDetails[]> {
  const policy = new ElitePolicy(ctx);

  return prisma.assignment.findMany({
    where: {
      cohortId,
      ...policy.tenantWhere(),
    },
    include: {
      item: {
        select: { id: true, name: true, moduleId: true },
      },
      rubric: true,
      submissions: {
        orderBy: { attemptNumber: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Create an assignment (linked to a Demonstrate It item)
 */
export async function createAssignment(
  ctx: EliteContext,
  data: {
    cohortId: string;
    itemId?: string;
    title: string;
    instructions: string;
    dueDate?: Date;
    rubricId?: string;
    maxAttempts?: number;
    requiresApproval?: boolean;
  }
): Promise<Assignment> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_ASSIGNMENTS");

  const audit = new EliteAudit(ctx);
  const events = new EliteEventBus(ctx);

  // Verify cohort access
  const cohort = await prisma.cohort.findFirst({
    where: {
      id: data.cohortId,
      ...policy.tenantWhere(),
    },
  });

  if (!cohort) {
    throw new Error("Cohort not found");
  }

  // Verify item if provided
  if (data.itemId) {
    const item = await prisma.courseItem.findFirst({
      where: {
        id: data.itemId,
        itemType: "DEMONSTRATE",
        ...policy.tenantWhere(),
      },
    });

    if (!item) {
      throw new Error("Demonstrate It item not found");
    }
  }

  const assignment = await prisma.assignment.create({
    data: {
      clientId: ctx.tenantId,
      cohortId: data.cohortId,
      createdById: ctx.userId,
      itemId: data.itemId,
      title: data.title,
      instructions: data.instructions,
      dueDate: data.dueDate,
      rubricId: data.rubricId,
      maxAttempts: data.maxAttempts || 1,
      requiresApproval: data.requiresApproval ?? true,
    },
  });

  await audit.log("ASSIGNMENT_CREATED", { type: "Assignment", id: assignment.id }, { title: assignment.title, itemId: assignment.itemId });
  await events.emit({
    eventType: "ASSIGNMENT_CREATED",
    entityType: "Assignment",
    entityId: assignment.id,
    data: {
      cohortId: assignment.cohortId,
      itemId: assignment.itemId,
      title: assignment.title,
    },
  });

  return assignment;
}

// ============================================
// Submission Management
// ============================================

/**
 * Get submission by ID
 */
export async function getSubmissionById(
  ctx: EliteContext,
  submissionId: string
): Promise<SubmissionWithDetails | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.submission.findFirst({
    where: {
      id: submissionId,
      ...policy.tenantWhere(),
    },
    include: {
      assignment: true,
      learner: true,
      artifact: true,
    },
  });
}

/**
 * List submissions with filters
 */
export async function listSubmissions(
  ctx: EliteContext,
  filters?: SubmissionFilters
): Promise<SubmissionWithDetails[]> {
  const policy = new ElitePolicy(ctx);

  const where: Record<string, unknown> = {
    ...policy.tenantWhere(),
    ...(filters?.assignmentId && { assignmentId: filters.assignmentId }),
    ...(filters?.learnerId && { learnerId: filters.learnerId }),
    ...(filters?.status && { status: filters.status }),
  };

  // If cohortId filter, join through assignment
  if (filters?.cohortId) {
    where.assignment = { cohortId: filters.cohortId };
  }

  return prisma.submission.findMany({
    where,
    include: {
      assignment: true,
      learner: true,
      artifact: true,
    },
    orderBy: { submittedAt: "desc" },
  });
}

/**
 * Create a new submission
 */
export async function createSubmission(
  ctx: EliteContext,
  assignmentId: string,
  artifactId: string,
  enrollmentId: string,
  content?: string
): Promise<Submission> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  // Verify assignment exists
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      ...policy.tenantWhere(),
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  // Verify artifact belongs to user
  const artifact = await prisma.artifact.findFirst({
    where: {
      id: artifactId,
      userId: ctx.userId,
      ...policy.tenantWhere(),
    },
  });

  if (!artifact) {
    throw new Error("Artifact not found");
  }

  // Get current attempt count
  const existingSubmissions = await prisma.submission.findMany({
    where: {
      assignmentId,
      learnerId: ctx.userId,
      ...policy.tenantWhere(),
    },
    orderBy: { attemptNumber: "desc" },
  });

  const currentAttempt = existingSubmissions.length;

  // Check max attempts
  if (currentAttempt >= assignment.maxAttempts) {
    throw new Error("Maximum submission attempts reached");
  }

  // Create submission
  const submission = await prisma.submission.create({
    data: {
      clientId: ctx.tenantId,
      assignmentId,
      learnerId: ctx.userId,
      artifactId,
      content,
      attemptNumber: currentAttempt + 1,
      status: "SUBMITTED",
    },
  });

  await events.emit({
    eventType: "SUBMISSION_CREATED",
    entityType: "Submission",
    entityId: submission.id,
    data: {
      assignmentId,
      attemptNumber: submission.attemptNumber,
      itemId: assignment.itemId,
    },
  });

  return submission;
}

/**
 * Resubmit (after needs revision)
 */
export async function resubmit(
  ctx: EliteContext,
  submissionId: string,
  artifactId: string,
  enrollmentId: string,
  content?: string
): Promise<Submission> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  // Get existing submission
  const existing = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      learnerId: ctx.userId,
      status: "NEEDS_REVISION",
      ...policy.tenantWhere(),
    },
    include: {
      assignment: true,
    },
  });

  if (!existing) {
    throw new Error("Submission not found or cannot be resubmitted");
  }

  // Verify artifact belongs to user
  const artifact = await prisma.artifact.findFirst({
    where: {
      id: artifactId,
      userId: ctx.userId,
      ...policy.tenantWhere(),
    },
  });

  if (!artifact) {
    throw new Error("Artifact not found");
  }

  // Get current attempt count
  const existingCount = await prisma.submission.count({
    where: {
      assignmentId: existing.assignmentId,
      learnerId: ctx.userId,
      ...policy.tenantWhere(),
    },
  });

  // Check max attempts
  if (existingCount >= existing.assignment.maxAttempts) {
    throw new Error("Maximum submission attempts reached");
  }

  // Create new submission as resubmit
  const submission = await prisma.submission.create({
    data: {
      clientId: ctx.tenantId,
      assignmentId: existing.assignmentId,
      learnerId: ctx.userId,
      artifactId,
      content,
      attemptNumber: existingCount + 1,
      status: "SUBMITTED",
    },
  });

  await events.emit({
    eventType: "SUBMISSION_CREATED",
    entityType: "Submission",
    entityId: submission.id,
    data: {
      assignmentId: existing.assignmentId,
      attemptNumber: submission.attemptNumber,
      isResubmit: true,
      previousSubmissionId: submissionId,
    },
  });

  return submission;
}

// ============================================
// Coach Review Workflow
// ============================================

/**
 * Get submissions needing review for a cohort
 */
export async function getSubmissionsForReview(
  ctx: EliteContext,
  cohortId: string
): Promise<SubmissionWithDetails[]> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("REVIEW_SUBMISSIONS");

  return prisma.submission.findMany({
    where: {
      status: "SUBMITTED",
      assignment: {
        cohortId,
        requiresApproval: true,
      },
      ...policy.tenantWhere(),
    },
    include: {
      assignment: true,
      learner: true,
      artifact: true,
    },
    orderBy: { submittedAt: "asc" }, // Oldest first (FIFO queue)
  });
}

/**
 * Review a submission (approve or request revision)
 */
export async function reviewSubmission(
  ctx: EliteContext,
  submissionId: string,
  review: ReviewData,
  enrollmentId?: string
): Promise<Submission> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("REVIEW_SUBMISSIONS");

  const audit = new EliteAudit(ctx);
  const events = new EliteEventBus(ctx);

  const existing = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      status: "SUBMITTED",
      ...policy.tenantWhere(),
    },
    include: {
      assignment: true,
    },
  });

  if (!existing) {
    throw new Error("Submission not found or already reviewed");
  }

  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: review.status,
      reviewedBy: ctx.userId,
      reviewedAt: new Date(),
      feedback: review.feedback,
      rubricScores: review.rubricScores
        ? JSON.stringify(review.rubricScores)
        : null,
    },
  });

  await audit.log("SUBMISSION_REVIEWED", { type: "Submission", id: submissionId }, { status: submission.status, learnerId: submission.learnerId });

  if (review.status === "APPROVED") {
    await events.emit({
      eventType: "SUBMISSION_APPROVED",
      entityType: "Submission",
      entityId: submissionId,
      data: {
        assignmentId: existing.assignmentId,
        learnerId: existing.learnerId,
        reviewerId: ctx.userId,
      },
    });

    // If linked to a curriculum item and enrollmentId provided, update item completion
    if (existing.assignment.itemId && enrollmentId) {
      await completionService.recordSubmissionApproval(
        ctx,
        existing.assignment.itemId,
        enrollmentId,
        submissionId
      );
    }
  } else {
    await events.emit({
      eventType: "SUBMISSION_REVISION_REQUESTED",
      entityType: "Submission",
      entityId: submissionId,
      data: {
        assignmentId: existing.assignmentId,
        learnerId: existing.learnerId,
        reviewerId: ctx.userId,
        feedback: review.feedback,
      },
    });
  }

  return submission;
}

/**
 * Approve a submission (convenience method)
 */
export async function approveSubmission(
  ctx: EliteContext,
  submissionId: string,
  feedback?: string,
  enrollmentId?: string
): Promise<Submission> {
  return reviewSubmission(
    ctx,
    submissionId,
    {
      status: "APPROVED",
      feedback: feedback || "Approved",
    },
    enrollmentId
  );
}

/**
 * Request revision (convenience method)
 */
export async function requestRevision(
  ctx: EliteContext,
  submissionId: string,
  feedback: string
): Promise<Submission> {
  return reviewSubmission(ctx, submissionId, {
    status: "NEEDS_REVISION",
    feedback,
  });
}

// ============================================
// Submission History and Status
// ============================================

/**
 * Get submission history for an assignment
 */
export async function getSubmissionHistory(
  ctx: EliteContext,
  assignmentId: string,
  learnerId?: string
): Promise<SubmissionWithDetails[]> {
  const policy = new ElitePolicy(ctx);

  const where: Record<string, unknown> = {
    assignmentId,
    ...policy.tenantWhere(),
  };

  // If not a coach/admin, can only see own submissions
  if (learnerId) {
    where.learnerId = learnerId;
  } else if (!policy.can("VIEW_ALL_SUBMISSIONS")) {
    where.learnerId = ctx.userId;
  }

  return prisma.submission.findMany({
    where,
    include: {
      assignment: true,
      learner: true,
      artifact: true,
    },
    orderBy: { attemptNumber: "desc" },
  });
}

/**
 * Get my submission for an assignment
 */
export async function getMySubmission(
  ctx: EliteContext,
  assignmentId: string
): Promise<SubmissionWithDetails | null> {
  const policy = new ElitePolicy(ctx);

  // Get latest submission
  return prisma.submission.findFirst({
    where: {
      assignmentId,
      learnerId: ctx.userId,
      ...policy.tenantWhere(),
    },
    include: {
      assignment: true,
      learner: true,
      artifact: true,
    },
    orderBy: { attemptNumber: "desc" },
  });
}

// ============================================
// Rubric Management
// ============================================

/**
 * Get rubric by ID
 */
export async function getRubricById(
  ctx: EliteContext,
  rubricId: string
): Promise<Rubric | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.rubric.findFirst({
    where: {
      id: rubricId,
      ...policy.tenantWhere(),
    },
  });
}

/**
 * List rubrics for the tenant
 */
export async function listRubrics(ctx: EliteContext): Promise<Rubric[]> {
  const policy = new ElitePolicy(ctx);

  return prisma.rubric.findMany({
    where: policy.tenantWhere(),
    orderBy: { name: "asc" },
  });
}

/**
 * Create a rubric
 */
export async function createRubric(
  ctx: EliteContext,
  name: string,
  description: string | undefined,
  criteria: RubricCriterion[]
): Promise<Rubric> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  return prisma.rubric.create({
    data: {
      clientId: ctx.tenantId,
      name,
      description,
      criteria: JSON.stringify(criteria),
    },
  });
}

// ============================================
// Analytics
// ============================================

/**
 * Get submission statistics for a cohort
 */
export async function getCohortSubmissionStats(
  ctx: EliteContext,
  cohortId: string
): Promise<{
  total: number;
  pending: number;
  approved: number;
  needsRevision: number;
  averageAttempts: number;
}> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("VIEW_ANALYTICS");

  const submissions = await prisma.submission.findMany({
    where: {
      assignment: { cohortId },
      ...policy.tenantWhere(),
    },
  });

  if (submissions.length === 0) {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      needsRevision: 0,
      averageAttempts: 0,
    };
  }

  // Group by learner+assignment to get unique submissions
  const uniqueSubmissions = new Map<string, typeof submissions>();
  for (const sub of submissions) {
    const key = `${sub.learnerId}-${sub.assignmentId}`;
    const existing = uniqueSubmissions.get(key);
    if (!existing) {
      uniqueSubmissions.set(key, [sub]);
    } else {
      existing.push(sub);
    }
  }

  let totalAttempts = 0;
  let pending = 0;
  let approved = 0;
  let needsRevision = 0;

  for (const [, subs] of Array.from(uniqueSubmissions)) {
    totalAttempts += subs.length;
    const latest = subs[0]; // Already sorted by attemptNumber desc
    if (latest.status === "SUBMITTED") pending++;
    else if (latest.status === "APPROVED") approved++;
    else if (latest.status === "NEEDS_REVISION") needsRevision++;
  }

  return {
    total: uniqueSubmissions.size,
    pending,
    approved,
    needsRevision,
    averageAttempts: Math.round((totalAttempts / uniqueSubmissions.size) * 10) / 10,
  };
}

// Export as a service object
export const submissionService = {
  // Assignments
  getAssignmentById,
  listAssignments,
  createAssignment,

  // Submissions
  getSubmissionById,
  listSubmissions,
  createSubmission,
  resubmit,
  getSubmissionHistory,
  getMySubmission,

  // Review workflow
  getSubmissionsForReview,
  reviewSubmission,
  approveSubmission,
  requestRevision,

  // Rubrics
  getRubricById,
  listRubrics,
  createRubric,

  // Analytics
  getCohortSubmissionStats,
};

