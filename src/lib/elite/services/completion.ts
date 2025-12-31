/**
 * ELITE Completion Service
 *
 * Evaluates and tracks item/module completion based on completion rules.
 * This is the "completion engine" that drives progress tracking.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "../kernel/types";
import { ElitePolicy } from "../kernel/policy";
import { EliteEventBus } from "../kernel/events";
import type {
  ItemProgress,
  ModuleProgress,
  CourseItem,
  Enrollment,
} from "@prisma/client";

// ============================================
// Types
// ============================================

export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface ItemProgressWithItem extends ItemProgress {
  item: CourseItem;
}

export interface CompletionResult {
  completed: boolean;
  progress: ItemProgress;
}

export interface ModuleCompletionStatus {
  moduleId: string;
  status: ProgressStatus;
  totalItems: number;
  completedItems: number;
  percentComplete: number;
  canAccess: boolean; // Based on prerequisites
}

export interface CourseCompletionStatus {
  enrollmentId: string;
  courseId: string;
  status: ProgressStatus;
  totalModules: number;
  completedModules: number;
  totalItems: number;
  completedItems: number;
  percentComplete: number;
}

// ============================================
// Item Completion Evaluation
// ============================================

/**
 * Evaluate if an item is complete based on its completion rule
 */
export async function evaluateItemCompletion(
  ctx: EliteContext,
  itemId: string,
  enrollmentId: string
): Promise<boolean> {
  const policy = new ElitePolicy(ctx);

  // Get item with its completion rule
  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  // Get current progress
  const progress = await prisma.itemProgress.findFirst({
    where: {
      itemId,
      enrollmentId,
      ...policy.tenantWhere(),
    },
  });

  if (!progress) {
    return false;
  }

  // Evaluate based on completion rule
  switch (item.completionRule) {
    case "VIEW":
      return progress.viewedAt !== null;

    case "MARK_DONE":
      return progress.markedDoneAt !== null;

    case "SUBMIT":
      return progress.submissionId !== null;

    case "SCORE_AT_LEAST":
      if (item.completionThreshold === null) {
        return false;
      }
      return (progress.bestScore ?? 0) >= item.completionThreshold;

    default:
      return false;
  }
}

/**
 * Get or create item progress for a learner
 */
async function getOrCreateItemProgress(
  ctx: EliteContext,
  itemId: string,
  enrollmentId: string
): Promise<ItemProgress> {
  const policy = new ElitePolicy(ctx);

  let progress = await prisma.itemProgress.findFirst({
    where: {
      itemId,
      enrollmentId,
      ...policy.tenantWhere(),
    },
  });

  if (!progress) {
    // Get the enrollment to verify access
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        ...policy.tenantWhere(),
      },
    });

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    progress = await prisma.itemProgress.create({
      data: {
        clientId: ctx.tenantId,
        enrollmentId,
        itemId,
        status: "NOT_STARTED",
      },
    });
  }

  return progress;
}

/**
 * Mark an item as viewed (for VIEW completion rule)
 */
export async function markItemViewed(
  ctx: EliteContext,
  itemId: string,
  enrollmentId: string
): Promise<CompletionResult> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  let progress = await getOrCreateItemProgress(ctx, itemId, enrollmentId);

  // Update if not already viewed
  if (!progress.viewedAt) {
    progress = await prisma.itemProgress.update({
      where: { id: progress.id },
      data: {
        viewedAt: new Date(),
        status: item.completionRule === "VIEW" ? "COMPLETED" : "IN_PROGRESS",
        ...(item.completionRule === "VIEW" && { completedAt: new Date() }),
      },
    });

    // Emit event
    await events.emit({
      eventType: "LEARNER_VIEWED_ITEM",
      entityType: "CourseItem",
      entityId: itemId,
      data: { itemType: item.itemType, enrollmentId },
    });

    // Check if this completes the item
    if (item.completionRule === "VIEW") {
      await events.emit({
        eventType: "LEARNER_COMPLETED_ITEM",
        entityType: "CourseItem",
        entityId: itemId,
        data: {
          itemType: item.itemType,
          completionRule: item.completionRule,
          enrollmentId,
        },
      });

      // Update module progress
      await updateModuleProgress(ctx, item.moduleId, enrollmentId);
    }
  }

  return {
    completed: progress.status === "COMPLETED",
    progress,
  };
}

/**
 * Mark an item as done (for MARK_DONE completion rule)
 */
export async function markItemDone(
  ctx: EliteContext,
  itemId: string,
  enrollmentId: string
): Promise<CompletionResult> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  let progress = await getOrCreateItemProgress(ctx, itemId, enrollmentId);

  // Update if not already marked done
  if (!progress.markedDoneAt) {
    progress = await prisma.itemProgress.update({
      where: { id: progress.id },
      data: {
        markedDoneAt: new Date(),
        status: item.completionRule === "MARK_DONE" ? "COMPLETED" : "IN_PROGRESS",
        ...(item.completionRule === "MARK_DONE" && { completedAt: new Date() }),
      },
    });

    // Check if this completes the item
    if (item.completionRule === "MARK_DONE") {
      await events.emit({
        eventType: "LEARNER_COMPLETED_ITEM",
        entityType: "CourseItem",
        entityId: itemId,
        data: {
          itemType: item.itemType,
          completionRule: item.completionRule,
          enrollmentId,
        },
      });

      // Update module progress
      await updateModuleProgress(ctx, item.moduleId, enrollmentId);
    }
  }

  return {
    completed: progress.status === "COMPLETED",
    progress,
  };
}

/**
 * Record a quiz score (for SCORE_AT_LEAST completion rule)
 */
export async function recordQuizScore(
  ctx: EliteContext,
  itemId: string,
  enrollmentId: string,
  score: number
): Promise<CompletionResult> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  let progress = await getOrCreateItemProgress(ctx, itemId, enrollmentId);

  // Update best score if this attempt is better
  const newBestScore = Math.max(progress.bestScore ?? 0, score);
  const meetsThreshold =
    item.completionRule === "SCORE_AT_LEAST" &&
    item.completionThreshold !== null &&
    newBestScore >= item.completionThreshold;

  const wasCompleted = progress.status === "COMPLETED";

  progress = await prisma.itemProgress.update({
    where: { id: progress.id },
    data: {
      bestScore: newBestScore,
      status: meetsThreshold ? "COMPLETED" : "IN_PROGRESS",
      ...(meetsThreshold && !wasCompleted && { completedAt: new Date() }),
    },
  });

  // Emit quiz score event
  await events.emit({
    eventType: "QUIZ_ATTEMPT_SCORED",
    entityType: "CourseItem",
    entityId: itemId,
    data: {
      score,
      bestScore: newBestScore,
      threshold: item.completionThreshold,
      enrollmentId,
    },
  });

  // Check if this completes the item for the first time
  if (meetsThreshold && !wasCompleted) {
    await events.emit({
      eventType: "LEARNER_COMPLETED_ITEM",
      entityType: "CourseItem",
      entityId: itemId,
      data: {
        itemType: item.itemType,
        completionRule: item.completionRule,
        score: newBestScore,
        enrollmentId,
      },
    });

    // Update module progress
    await updateModuleProgress(ctx, item.moduleId, enrollmentId);
  }

  return {
    completed: progress.status === "COMPLETED",
    progress,
  };
}

/**
 * Record submission approval (for SUBMIT completion rule - Demonstrate It)
 */
export async function recordSubmissionApproval(
  ctx: EliteContext,
  itemId: string,
  enrollmentId: string,
  submissionId: string
): Promise<CompletionResult> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  let progress = await getOrCreateItemProgress(ctx, itemId, enrollmentId);

  const wasCompleted = progress.status === "COMPLETED";

  progress = await prisma.itemProgress.update({
    where: { id: progress.id },
    data: {
      submissionId,
      status: "COMPLETED",
      ...(!wasCompleted && { completedAt: new Date() }),
    },
  });

  // Check if this completes the item for the first time
  if (!wasCompleted) {
    await events.emit({
      eventType: "LEARNER_COMPLETED_ITEM",
      entityType: "CourseItem",
      entityId: itemId,
      data: {
        itemType: item.itemType,
        completionRule: item.completionRule,
        submissionId,
        enrollmentId,
      },
    });

    // Update module progress
    await updateModuleProgress(ctx, item.moduleId, enrollmentId);
  }

  return {
    completed: true,
    progress,
  };
}

// ============================================
// Module Completion
// ============================================

/**
 * Update module progress based on item completions
 */
async function updateModuleProgress(
  ctx: EliteContext,
  moduleId: string,
  enrollmentId: string
): Promise<void> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  // Get all items in the module
  const items = await prisma.courseItem.findMany({
    where: {
      moduleId,
      ...policy.tenantWhere(),
    },
  });

  // Get all item progress for this enrollment
  const progressRecords = await prisma.itemProgress.findMany({
    where: {
      enrollmentId,
      itemId: { in: items.map((i) => i.id) },
      ...policy.tenantWhere(),
    },
  });

  const completedCount = progressRecords.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const totalItems = items.length;

  // Determine module status
  let status: ProgressStatus = "NOT_STARTED";
  if (completedCount > 0 && completedCount < totalItems) {
    status = "IN_PROGRESS";
  } else if (completedCount === totalItems && totalItems > 0) {
    status = "COMPLETED";
  }

  // Get or create module progress
  let moduleProgress = await prisma.moduleProgress.findFirst({
    where: {
      moduleId,
      enrollmentId,
      ...policy.tenantWhere(),
    },
  });

  const wasCompleted = moduleProgress?.status === "COMPLETED";

  if (moduleProgress) {
    moduleProgress = await prisma.moduleProgress.update({
      where: { id: moduleProgress.id },
      data: {
        status,
        ...(status === "COMPLETED" && !wasCompleted && { completedAt: new Date() }),
      },
    });
  } else {
    moduleProgress = await prisma.moduleProgress.create({
      data: {
        clientId: ctx.tenantId,
        enrollmentId,
        moduleId,
        status,
        ...(status === "COMPLETED" && { completedAt: new Date() }),
      },
    });
  }

  // Emit module completion event if newly completed
  if (status === "COMPLETED" && !wasCompleted) {
    await events.emit({
      eventType: "MODULE_COMPLETED",
      entityType: "CourseModule",
      entityId: moduleId,
      data: { enrollmentId, itemsCompleted: completedCount },
    });

    // Check if this completes the course
    const courseModule = await prisma.courseModule.findUnique({
      where: { id: moduleId },
    });
    if (courseModule) {
      await updateEnrollmentProgress(ctx, enrollmentId, courseModule.courseId);
    }
  }
}

/**
 * Update enrollment progress based on module completions
 */
async function updateEnrollmentProgress(
  ctx: EliteContext,
  enrollmentId: string,
  courseId: string
): Promise<void> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  // Get all modules in the course
  const modules = await prisma.courseModule.findMany({
    where: {
      courseId,
      ...policy.tenantWhere(),
    },
  });

  // Get all module progress for this enrollment
  const progressRecords = await prisma.moduleProgress.findMany({
    where: {
      enrollmentId,
      moduleId: { in: modules.map((m) => m.id) },
      ...policy.tenantWhere(),
    },
  });

  const completedCount = progressRecords.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const totalModules = modules.length;

  // Determine enrollment status
  let status: ProgressStatus = "NOT_STARTED";
  if (completedCount > 0 && completedCount < totalModules) {
    status = "IN_PROGRESS";
  } else if (completedCount === totalModules && totalModules > 0) {
    status = "COMPLETED";
  }

  // Get enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      ...policy.tenantWhere(),
    },
  });

  if (!enrollment) {
    return;
  }

  const wasCompleted = enrollment.status === "COMPLETED";

  if (status === "COMPLETED" && !wasCompleted) {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await events.emit({
      eventType: "COURSE_COMPLETED",
      entityType: "Course",
      entityId: courseId,
      data: { enrollmentId, modulesCompleted: completedCount },
    });
  }
}

/**
 * Check if a module is accessible (prerequisites met)
 */
export async function canAccessModule(
  ctx: EliteContext,
  moduleId: string,
  enrollmentId: string
): Promise<boolean> {
  const policy = new ElitePolicy(ctx);

  const courseModule = await prisma.courseModule.findFirst({
    where: {
      id: moduleId,
      ...policy.tenantWhere(),
    },
  });

  if (!courseModule) {
    return false;
  }

  // If no prerequisite, always accessible
  if (!courseModule.prerequisiteModuleId) {
    return true;
  }

  // Check prerequisite module completion
  const prereqProgress = await prisma.moduleProgress.findFirst({
    where: {
      moduleId: courseModule.prerequisiteModuleId,
      enrollmentId,
      ...policy.tenantWhere(),
    },
  });

  return prereqProgress?.status === "COMPLETED";
}

// ============================================
// Progress Queries
// ============================================

/**
 * Get completion status for all modules in a course
 */
export async function getModuleCompletionStatus(
  ctx: EliteContext,
  courseId: string,
  enrollmentId: string
): Promise<ModuleCompletionStatus[]> {
  const policy = new ElitePolicy(ctx);

  // Get all modules with their items
  const modules = await prisma.courseModule.findMany({
    where: {
      courseId,
      ...policy.tenantWhere(),
    },
    include: {
      items: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  // Get all progress records for this enrollment
  const itemProgress = await prisma.itemProgress.findMany({
    where: {
      enrollmentId,
      item: { moduleId: { in: modules.map((m) => m.id) } },
      ...policy.tenantWhere(),
    },
  });

  const moduleProgress = await prisma.moduleProgress.findMany({
    where: {
      enrollmentId,
      moduleId: { in: modules.map((m) => m.id) },
      ...policy.tenantWhere(),
    },
  });

  // Build completion status for each module
  const results: ModuleCompletionStatus[] = [];

  for (const courseModule of modules) {
    const itemProgressForModule = itemProgress.filter(
      (p) => courseModule.items.some((i) => i.id === p.itemId)
    );
    const completedItems = itemProgressForModule.filter(
      (p) => p.status === "COMPLETED"
    ).length;
    const totalItems = courseModule.items.length;

    const modProgress = moduleProgress.find((p) => p.moduleId === courseModule.id);
    const status: ProgressStatus = modProgress?.status as ProgressStatus || "NOT_STARTED";

    // Check prerequisites
    let canAccess = true;
    if (courseModule.prerequisiteModuleId) {
      const prereqProgress = moduleProgress.find(
        (p) => p.moduleId === courseModule.prerequisiteModuleId
      );
      canAccess = prereqProgress?.status === "COMPLETED";
    }

    results.push({
      moduleId: courseModule.id,
      status,
      totalItems,
      completedItems,
      percentComplete: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      canAccess,
    });
  }

  return results;
}

/**
 * Get overall course completion status
 */
export async function getCourseCompletionStatus(
  ctx: EliteContext,
  enrollmentId: string
): Promise<CourseCompletionStatus | null> {
  const policy = new ElitePolicy(ctx);

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      ...policy.tenantWhere(),
    },
    include: {
      course: {
        include: {
          modules: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    return null;
  }

  // Get all progress records
  const moduleProgress = await prisma.moduleProgress.findMany({
    where: {
      enrollmentId,
      ...policy.tenantWhere(),
    },
  });

  const itemProgress = await prisma.itemProgress.findMany({
    where: {
      enrollmentId,
      ...policy.tenantWhere(),
    },
  });

  const totalModules = enrollment.course.modules.length;
  const completedModules = moduleProgress.filter(
    (p) => p.status === "COMPLETED"
  ).length;

  const totalItems = enrollment.course.modules.reduce(
    (acc, m) => acc + m.items.length,
    0
  );
  const completedItems = itemProgress.filter(
    (p) => p.status === "COMPLETED"
  ).length;

  return {
    enrollmentId,
    courseId: enrollment.courseId,
    status: enrollment.status as ProgressStatus,
    totalModules,
    completedModules,
    totalItems,
    completedItems,
    percentComplete: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
  };
}

/**
 * Get item progress for a specific item
 */
export async function getItemProgress(
  ctx: EliteContext,
  itemId: string,
  enrollmentId: string
): Promise<ItemProgressWithItem | null> {
  const policy = new ElitePolicy(ctx);

  const progress = await prisma.itemProgress.findFirst({
    where: {
      itemId,
      enrollmentId,
      ...policy.tenantWhere(),
    },
    include: {
      item: true,
    },
  });

  return progress;
}

// Export as a service object
export const completionService = {
  // Evaluation
  evaluateItemCompletion,
  canAccessModule,

  // Progress updates
  markItemViewed,
  markItemDone,
  recordQuizScore,
  recordSubmissionApproval,

  // Queries
  getModuleCompletionStatus,
  getCourseCompletionStatus,
  getItemProgress,
};

