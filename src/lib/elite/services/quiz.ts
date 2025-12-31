/**
 * ELITE Quiz Service
 *
 * Manages quiz attempts, scoring, and mastery tracking for Learn It items.
 * Supports ELITE's mastery-oriented approach where retakes are encouraged.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "../kernel/types";
import { ElitePolicy } from "../kernel/policy";
import { EliteEventBus } from "../kernel/events";
import { completionService } from "./completion";
import type { QuizAttempt, CourseItem, User } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface QuizQuestion {
  id: string;
  text: string;
  type: "multiple_choice" | "true_false" | "multiple_select";
  options: { id: string; text: string }[];
  correctAnswers: string[]; // IDs of correct options
  explanation?: string;
  points?: number;
}

export interface QuizContent {
  itemId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingScore: number; // Percentage required to pass
  allowRetakes: boolean;
  showCorrectAnswers: boolean; // After submission
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswers: string[]; // IDs of selected options
}

export interface QuizAttemptResult extends QuizAttempt {
  item: CourseItem;
  user: User;
}

export interface QuizSubmissionResult {
  attempt: QuizAttempt;
  score: number;
  passed: boolean;
  itemCompleted: boolean;
  results: {
    questionId: string;
    correct: boolean;
    selectedAnswers: string[];
    correctAnswers: string[];
    explanation?: string;
  }[];
}

export interface LearnerQuizStatus {
  userId: string;
  userName: string;
  userEmail: string;
  itemId: string;
  itemName: string;
  attempts: number;
  bestScore: number;
  passed: boolean;
  lastAttemptAt: Date | null;
}

// ============================================
// Quiz Content Management
// ============================================

/**
 * Get quiz content for an item
 */
export async function getQuizContent(
  ctx: EliteContext,
  itemId: string
): Promise<QuizContent | null> {
  const policy = new ElitePolicy(ctx);

  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      itemType: "LEARN",
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    return null;
  }

  if (!item.content) {
    throw new Error("Quiz content not configured for this item");
  }

  try {
    const content = JSON.parse(item.content) as {
      questions: QuizQuestion[];
      allowRetakes?: boolean;
      showCorrectAnswers?: boolean;
    };

    return {
      itemId: item.id,
      title: item.name,
      description: item.description || undefined,
      questions: content.questions,
      passingScore: item.completionThreshold || 80,
      allowRetakes: content.allowRetakes ?? true,
      showCorrectAnswers: content.showCorrectAnswers ?? true,
    };
  } catch {
    throw new Error("Invalid quiz content format");
  }
}

/**
 * Get quiz content for learner (strips correct answers)
 */
export async function getQuizForLearner(
  ctx: EliteContext,
  itemId: string
): Promise<Omit<QuizContent, "questions"> & { questions: Omit<QuizQuestion, "correctAnswers" | "explanation">[] }> {
  const content = await getQuizContent(ctx, itemId);

  if (!content) {
    throw new Error("Quiz not found");
  }

  // Strip correct answers and explanations for learner
  return {
    ...content,
    questions: content.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options,
      points: q.points,
    })),
  };
}

// ============================================
// Attempt Management
// ============================================

/**
 * Start a new quiz attempt
 */
export async function startAttempt(
  ctx: EliteContext,
  itemId: string,
  enrollmentId: string
): Promise<QuizAttempt> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  // Verify item is a LEARN type
  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      itemType: "LEARN",
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Quiz item not found");
  }

  // Verify enrollment exists
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      userId: ctx.userId,
      ...policy.tenantWhere(),
    },
  });

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  // Get current attempt count
  const existingAttempts = await prisma.quizAttempt.count({
    where: {
      itemId,
      userId: ctx.userId,
      ...policy.tenantWhere(),
    },
  });

  // Create new attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      clientId: ctx.tenantId,
      itemId,
      userId: ctx.userId,
      score: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      answers: "[]",
      attemptNumber: existingAttempts + 1,
    },
  });

  await events.emit({
    eventType: "QUIZ_ATTEMPT_STARTED",
    entityType: "QuizAttempt",
    entityId: attempt.id,
    data: {
      itemId,
      attemptNumber: attempt.attemptNumber,
    },
  });

  return attempt;
}

/**
 * Submit quiz answers and get results
 */
export async function submitAttempt(
  ctx: EliteContext,
  attemptId: string,
  answers: QuizAnswer[],
  enrollmentId: string
): Promise<QuizSubmissionResult> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  // Get the attempt
  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId,
      userId: ctx.userId,
      completedAt: null, // Must not be already completed
      ...policy.tenantWhere(),
    },
  });

  if (!attempt) {
    throw new Error("Quiz attempt not found or already completed");
  }

  // Get quiz content with correct answers
  const quizContent = await getQuizContent(ctx, attempt.itemId);

  if (!quizContent) {
    throw new Error("Quiz content not found");
  }

  // Grade the quiz
  const results: QuizSubmissionResult["results"] = [];
  let correctCount = 0;
  const totalQuestions = quizContent.questions.length;

  for (const question of quizContent.questions) {
    const answer = answers.find((a) => a.questionId === question.id);
    const selectedAnswers = answer?.selectedAnswers || [];

    // Check if correct (all correct answers selected, no incorrect ones)
    const isCorrect =
      question.correctAnswers.length === selectedAnswers.length &&
      question.correctAnswers.every((a) => selectedAnswers.includes(a));

    if (isCorrect) {
      correctCount++;
    }

    results.push({
      questionId: question.id,
      correct: isCorrect,
      selectedAnswers,
      correctAnswers: quizContent.showCorrectAnswers ? question.correctAnswers : [],
      explanation: quizContent.showCorrectAnswers ? question.explanation : undefined,
    });
  }

  // Calculate score
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= quizContent.passingScore;

  // Calculate time spent
  const timeSpentSeconds = Math.floor(
    (new Date().getTime() - attempt.startedAt.getTime()) / 1000
  );

  // Update attempt with results
  const completedAttempt = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      totalQuestions,
      correctAnswers: correctCount,
      answers: JSON.stringify(answers),
      completedAt: new Date(),
      timeSpentSeconds,
    },
  });

  // Emit quiz scored event
  await events.emit({
    eventType: "QUIZ_ATTEMPT_SCORED",
    entityType: "QuizAttempt",
    entityId: attemptId,
    data: {
      itemId: attempt.itemId,
      score,
      passed,
      attemptNumber: attempt.attemptNumber,
      timeSpentSeconds,
    },
  });

  // Record score for item completion
  const completionResult = await completionService.recordQuizScore(
    ctx,
    attempt.itemId,
    enrollmentId,
    score
  );

  return {
    attempt: completedAttempt,
    score,
    passed,
    itemCompleted: completionResult.completed,
    results,
  };
}

// ============================================
// Attempt History and Mastery
// ============================================

/**
 * Get attempt history for a quiz item
 */
export async function getAttemptHistory(
  ctx: EliteContext,
  itemId: string
): Promise<QuizAttempt[]> {
  const policy = new ElitePolicy(ctx);

  return prisma.quizAttempt.findMany({
    where: {
      itemId,
      userId: ctx.userId,
      completedAt: { not: null },
      ...policy.tenantWhere(),
    },
    orderBy: { completedAt: "desc" },
  });
}

/**
 * Get best score for a quiz item
 */
export async function getBestScore(
  ctx: EliteContext,
  itemId: string
): Promise<number | null> {
  const policy = new ElitePolicy(ctx);

  const result = await prisma.quizAttempt.aggregate({
    where: {
      itemId,
      userId: ctx.userId,
      completedAt: { not: null },
      ...policy.tenantWhere(),
    },
    _max: {
      score: true,
    },
  });

  return result._max.score;
}

/**
 * Get quiz statistics for an item across all learners
 */
export async function getQuizStatistics(
  ctx: EliteContext,
  itemId: string
): Promise<{
  totalAttempts: number;
  uniqueLearners: number;
  averageScore: number;
  passRate: number;
  averageTimeSeconds: number;
}> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("VIEW_ANALYTICS");

  // Get item for passing threshold
  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  const passingScore = item.completionThreshold || 80;

  // Get all completed attempts
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      itemId,
      completedAt: { not: null },
      ...policy.tenantWhere(),
    },
  });

  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      uniqueLearners: 0,
      averageScore: 0,
      passRate: 0,
      averageTimeSeconds: 0,
    };
  }

  const uniqueLearners = new Set(attempts.map((a) => a.userId)).size;
  const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
  const passedCount = attempts.filter((a) => a.score >= passingScore).length;
  const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);

  return {
    totalAttempts: attempts.length,
    uniqueLearners,
    averageScore: Math.round(totalScore / attempts.length),
    passRate: Math.round((passedCount / attempts.length) * 100),
    averageTimeSeconds: Math.round(totalTime / attempts.length),
  };
}

// ============================================
// Coach Views
// ============================================

/**
 * Get learners needing help (below threshold) for a cohort
 */
export async function getLearnersNeedingHelp(
  ctx: EliteContext,
  cohortId: string,
  itemId: string,
  threshold?: number
): Promise<LearnerQuizStatus[]> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("VIEW_COHORTS");

  // Get item for default threshold
  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  const passingScore = threshold || item.completionThreshold || 80;

  // Get all enrollments for the cohort
  const enrollments = await prisma.enrollment.findMany({
    where: {
      cohortId,
      status: "ACTIVE",
      ...policy.tenantWhere(),
    },
    include: {
      user: true,
    },
  });

  const result: LearnerQuizStatus[] = [];

  for (const enrollment of enrollments) {
    // Get best score for this learner
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        itemId,
        userId: enrollment.userId,
        completedAt: { not: null },
        ...policy.tenantWhere(),
      },
      orderBy: { score: "desc" },
    });

    const bestScore = attempts[0]?.score || 0;
    const passed = bestScore >= passingScore;
    const lastAttempt = attempts.length > 0 ? attempts[0] : null;

    // Only include learners who haven't passed
    if (!passed) {
      result.push({
        userId: enrollment.userId,
        userName: enrollment.user.name,
        userEmail: enrollment.user.email,
        itemId,
        itemName: item.name,
        attempts: attempts.length,
        bestScore,
        passed: false,
        lastAttemptAt: lastAttempt?.completedAt || null,
      });
    }
  }

  // Sort by best score (lowest first - most help needed)
  return result.sort((a, b) => a.bestScore - b.bestScore);
}

/**
 * Get quiz progress for all learners in a cohort
 */
export async function getCohortQuizProgress(
  ctx: EliteContext,
  cohortId: string,
  itemId: string
): Promise<LearnerQuizStatus[]> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("VIEW_COHORTS");

  // Get item
  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  const passingScore = item.completionThreshold || 80;

  // Get all enrollments for the cohort
  const enrollments = await prisma.enrollment.findMany({
    where: {
      cohortId,
      status: "ACTIVE",
      ...policy.tenantWhere(),
    },
    include: {
      user: true,
    },
  });

  const result: LearnerQuizStatus[] = [];

  for (const enrollment of enrollments) {
    // Get attempts for this learner
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        itemId,
        userId: enrollment.userId,
        completedAt: { not: null },
        ...policy.tenantWhere(),
      },
      orderBy: { completedAt: "desc" },
    });

    const bestScore = Math.max(0, ...attempts.map((a) => a.score));
    const passed = bestScore >= passingScore;
    const lastAttempt = attempts[0];

    result.push({
      userId: enrollment.userId,
      userName: enrollment.user.name,
      userEmail: enrollment.user.email,
      itemId,
      itemName: item.name,
      attempts: attempts.length,
      bestScore,
      passed,
      lastAttemptAt: lastAttempt?.completedAt || null,
    });
  }

  return result;
}

// Export as a service object
export const quizService = {
  // Content
  getQuizContent,
  getQuizForLearner,

  // Attempts
  startAttempt,
  submitAttempt,
  getAttemptHistory,
  getBestScore,

  // Analytics
  getQuizStatistics,

  // Coach views
  getLearnersNeedingHelp,
  getCohortQuizProgress,
};

