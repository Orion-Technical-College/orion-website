/**
 * ELITE Discussion Service
 *
 * Manages discussion posts, replies, and participation tracking for Discuss It items.
 * Supports ELITE's requirement: must post AND reply to at least one peer.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "../kernel/types";
import { ElitePolicy } from "../kernel/policy";
import { EliteEventBus } from "../kernel/events";
import type {
  DiscussionPost,
  DiscussionRequirement,
  DiscussionProgress,
  User,
} from "@prisma/client";

// ============================================
// Types
// ============================================

export interface DiscussionPostWithAuthor extends DiscussionPost {
  author: User;
  replies?: DiscussionPostWithAuthor[];
}

export interface DiscussionThread {
  post: DiscussionPostWithAuthor;
  replies: DiscussionPostWithAuthor[];
  replyCount: number;
}

export interface ParticipationStatus {
  itemId: string;
  userId: string;
  postCount: number;
  replyCount: number;
  requirementMet: boolean;
  requirement: {
    requirePost: boolean;
    minReplies: number;
  };
}

export interface CreatePostInput {
  itemId: string;
  content: string;
  parentId?: string; // If set, this is a reply
}

// ============================================
// Discussion Requirement Management
// ============================================

/**
 * Get or create discussion requirement for an item
 */
export async function getDiscussionRequirement(
  ctx: EliteContext,
  itemId: string
): Promise<DiscussionRequirement | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.discussionRequirement.findFirst({
    where: {
      itemId,
      ...policy.tenantWhere(),
    },
  });
}

/**
 * Set discussion requirement for an item
 */
export async function setDiscussionRequirement(
  ctx: EliteContext,
  itemId: string,
  requirePost: boolean = true,
  minReplies: number = 1
): Promise<DiscussionRequirement> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  // Verify item exists and is DISCUSS type
  const item = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      itemType: "DISCUSS",
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Discussion item not found");
  }

  // Upsert requirement
  return prisma.discussionRequirement.upsert({
    where: { itemId },
    update: {
      requirePost,
      minReplies,
    },
    create: {
      clientId: ctx.tenantId,
      itemId,
      requirePost,
      minReplies,
    },
  });
}

// ============================================
// Post Management
// ============================================

/**
 * Get all posts for a discussion item (with thread structure)
 */
export async function getPosts(
  ctx: EliteContext,
  itemId: string
): Promise<DiscussionThread[]> {
  const policy = new ElitePolicy(ctx);

  // Get all root posts (no parent)
  const rootPosts = await prisma.discussionPost.findMany({
    where: {
      itemId,
      parentId: null,
      isHidden: false,
      ...policy.tenantWhere(),
    },
    include: {
      author: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get all replies for these posts
  const threads: DiscussionThread[] = [];

  for (const post of rootPosts) {
    const replies = await prisma.discussionPost.findMany({
      where: {
        parentId: post.id,
        isHidden: false,
        ...policy.tenantWhere(),
      },
      include: {
        author: true,
      },
      orderBy: { createdAt: "asc" },
    });

    threads.push({
      post: post as DiscussionPostWithAuthor,
      replies: replies as DiscussionPostWithAuthor[],
      replyCount: replies.length,
    });
  }

  return threads;
}

/**
 * Get a single post by ID
 */
export async function getPostById(
  ctx: EliteContext,
  postId: string
): Promise<DiscussionPostWithAuthor | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.discussionPost.findFirst({
    where: {
      id: postId,
      ...policy.tenantWhere(),
    },
    include: {
      author: true,
    },
  });
}

/**
 * Create a new post or reply
 */
export async function createPost(
  ctx: EliteContext,
  data: CreatePostInput,
  enrollmentId: string
): Promise<DiscussionPostWithAuthor> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  // Verify item exists and is DISCUSS type
  const item = await prisma.courseItem.findFirst({
    where: {
      id: data.itemId,
      itemType: "DISCUSS",
      ...policy.tenantWhere(),
    },
  });

  if (!item) {
    throw new Error("Discussion item not found");
  }

  // If this is a reply, verify parent exists and is not hidden
  let isReply = false;
  if (data.parentId) {
    const parent = await prisma.discussionPost.findFirst({
      where: {
        id: data.parentId,
        itemId: data.itemId,
        isHidden: false,
        ...policy.tenantWhere(),
      },
    });

    if (!parent) {
      throw new Error("Parent post not found");
    }

    // Check that we're not replying to our own post
    if (parent.authorId === ctx.userId) {
      throw new Error("Cannot reply to your own post");
    }

    isReply = true;
  }

  // Create the post
  const post = await prisma.discussionPost.create({
    data: {
      clientId: ctx.tenantId,
      itemId: data.itemId,
      authorId: ctx.userId,
      parentId: data.parentId,
      content: data.content,
    },
    include: {
      author: true,
    },
  });

  // Update participation progress
  await updateParticipationProgress(ctx, data.itemId, enrollmentId);

  // Emit event
  await events.emit({
    eventType: "DISCUSSION_POST_CREATED",
    entityType: "DiscussionPost",
    entityId: post.id,
    data: {
      itemId: data.itemId,
      isReply,
      parentId: data.parentId,
    },
  });

  return post as DiscussionPostWithAuthor;
}

/**
 * Update a post (author only, within edit window)
 */
export async function updatePost(
  ctx: EliteContext,
  postId: string,
  content: string
): Promise<DiscussionPostWithAuthor> {
  const policy = new ElitePolicy(ctx);

  const existing = await prisma.discussionPost.findFirst({
    where: {
      id: postId,
      authorId: ctx.userId, // Can only edit own posts
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Post not found or not authorized to edit");
  }

  // Check edit window (e.g., 30 minutes)
  const editWindowMs = 30 * 60 * 1000;
  if (Date.now() - existing.createdAt.getTime() > editWindowMs) {
    throw new Error("Edit window has expired");
  }

  const post = await prisma.discussionPost.update({
    where: { id: postId },
    data: { content },
    include: { author: true },
  });

  return post as DiscussionPostWithAuthor;
}

/**
 * Hide a post (moderation - coaches/admins only)
 */
export async function hidePost(
  ctx: EliteContext,
  postId: string
): Promise<DiscussionPost> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MODERATE_DISCUSSIONS");

  const existing = await prisma.discussionPost.findFirst({
    where: {
      id: postId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Post not found");
  }

  return prisma.discussionPost.update({
    where: { id: postId },
    data: {
      isHidden: true,
      hiddenBy: ctx.userId,
      hiddenAt: new Date(),
    },
  });
}

/**
 * Unhide a post (moderation)
 */
export async function unhidePost(
  ctx: EliteContext,
  postId: string
): Promise<DiscussionPost> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MODERATE_DISCUSSIONS");

  const existing = await prisma.discussionPost.findFirst({
    where: {
      id: postId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Post not found");
  }

  return prisma.discussionPost.update({
    where: { id: postId },
    data: {
      isHidden: false,
      hiddenBy: null,
      hiddenAt: null,
    },
  });
}

// ============================================
// Participation Tracking
// ============================================

/**
 * Update participation progress for a user
 */
async function updateParticipationProgress(
  ctx: EliteContext,
  itemId: string,
  enrollmentId: string
): Promise<void> {
  const policy = new ElitePolicy(ctx);
  const events = new EliteEventBus(ctx);

  // Count posts and replies by this user
  const posts = await prisma.discussionPost.findMany({
    where: {
      itemId,
      authorId: ctx.userId,
      isHidden: false,
      ...policy.tenantWhere(),
    },
  });

  const postCount = posts.filter((p) => p.parentId === null).length;
  const replyCount = posts.filter((p) => p.parentId !== null).length;

  // Get requirement
  const requirement = await prisma.discussionRequirement.findFirst({
    where: {
      itemId,
      ...policy.tenantWhere(),
    },
  });

  // Default requirement: 1 post + 1 reply
  const requirePost = requirement?.requirePost ?? true;
  const minReplies = requirement?.minReplies ?? 1;

  // Check if requirement is met
  const postRequirementMet = !requirePost || postCount >= 1;
  const replyRequirementMet = replyCount >= minReplies;
  const requirementMet = postRequirementMet && replyRequirementMet;

  // Get or create progress record
  let progress = await prisma.discussionProgress.findFirst({
    where: {
      itemId,
      userId: ctx.userId,
      ...policy.tenantWhere(),
    },
  });

  const wasAlreadyMet = progress?.requirementMet ?? false;

  if (progress) {
    progress = await prisma.discussionProgress.update({
      where: { id: progress.id },
      data: {
        postCount,
        replyCount,
        requirementMet,
        ...(requirementMet && !wasAlreadyMet && { metAt: new Date() }),
      },
    });
  } else {
    progress = await prisma.discussionProgress.create({
      data: {
        clientId: ctx.tenantId,
        itemId,
        userId: ctx.userId,
        postCount,
        replyCount,
        requirementMet,
        ...(requirementMet && { metAt: new Date() }),
      },
    });
  }

  // Emit event if requirement newly met
  if (requirementMet && !wasAlreadyMet) {
    await events.emit({
      eventType: "DISCUSSION_REQUIREMENT_MET",
      entityType: "DiscussionProgress",
      entityId: progress.id,
      data: {
        itemId,
        postCount,
        replyCount,
      },
    });

    // Update item completion
    const { completionService } = await import("./completion");
    await completionService.markItemDone(ctx, itemId, enrollmentId);
  }
}

/**
 * Check if discussion requirement is met for a user
 */
export async function checkRequirementMet(
  ctx: EliteContext,
  itemId: string
): Promise<boolean> {
  const policy = new ElitePolicy(ctx);

  const progress = await prisma.discussionProgress.findFirst({
    where: {
      itemId,
      userId: ctx.userId,
      ...policy.tenantWhere(),
    },
  });

  return progress?.requirementMet ?? false;
}

/**
 * Get participation status for a user
 */
export async function getParticipationStatus(
  ctx: EliteContext,
  itemId: string
): Promise<ParticipationStatus> {
  const policy = new ElitePolicy(ctx);

  const progress = await prisma.discussionProgress.findFirst({
    where: {
      itemId,
      userId: ctx.userId,
      ...policy.tenantWhere(),
    },
  });

  const requirement = await prisma.discussionRequirement.findFirst({
    where: {
      itemId,
      ...policy.tenantWhere(),
    },
  });

  return {
    itemId,
    userId: ctx.userId,
    postCount: progress?.postCount ?? 0,
    replyCount: progress?.replyCount ?? 0,
    requirementMet: progress?.requirementMet ?? false,
    requirement: {
      requirePost: requirement?.requirePost ?? true,
      minReplies: requirement?.minReplies ?? 1,
    },
  };
}

// ============================================
// Coach/Moderation Views
// ============================================

/**
 * Get posts for moderation (includes hidden posts)
 */
export async function getPostsForModeration(
  ctx: EliteContext,
  cohortId: string,
  itemId?: string
): Promise<DiscussionPostWithAuthor[]> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MODERATE_DISCUSSIONS");

  // Get all items for the cohort's course
  let itemIds: string[] = [];

  if (itemId) {
    itemIds = [itemId];
  } else {
    // Get all DISCUSS items for the cohort's course
    const enrollments = await prisma.enrollment.findMany({
      where: {
        cohortId,
        ...policy.tenantWhere(),
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                items: {
                  where: { itemType: "DISCUSS" },
                },
              },
            },
          },
        },
      },
    });

    if (enrollments.length > 0) {
      for (const enrollment of enrollments) {
        for (const courseModule of enrollment.course.modules) {
          itemIds.push(...courseModule.items.map((i) => i.id));
        }
      }
    }
  }

  if (itemIds.length === 0) {
    return [];
  }

  return prisma.discussionPost.findMany({
    where: {
      itemId: { in: itemIds },
      ...policy.tenantWhere(),
    },
    include: {
      author: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get participation summary for a cohort
 */
export async function getCohortParticipationSummary(
  ctx: EliteContext,
  cohortId: string,
  itemId: string
): Promise<{
  totalLearners: number;
  participated: number;
  requirementsMet: number;
  participationRate: number;
  completionRate: number;
}> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("VIEW_COHORTS");

  // Get all enrollments for the cohort
  const enrollments = await prisma.enrollment.findMany({
    where: {
      cohortId,
      status: "ACTIVE",
      ...policy.tenantWhere(),
    },
  });

  const totalLearners = enrollments.length;

  if (totalLearners === 0) {
    return {
      totalLearners: 0,
      participated: 0,
      requirementsMet: 0,
      participationRate: 0,
      completionRate: 0,
    };
  }

  // Get progress for all users
  const progressRecords = await prisma.discussionProgress.findMany({
    where: {
      itemId,
      userId: { in: enrollments.map((e) => e.userId) },
      ...policy.tenantWhere(),
    },
  });

  const participated = progressRecords.filter(
    (p) => p.postCount > 0 || p.replyCount > 0
  ).length;
  const requirementsMet = progressRecords.filter((p) => p.requirementMet).length;

  return {
    totalLearners,
    participated,
    requirementsMet,
    participationRate: Math.round((participated / totalLearners) * 100),
    completionRate: Math.round((requirementsMet / totalLearners) * 100),
  };
}

// Export as a service object
export const discussionService = {
  // Requirements
  getDiscussionRequirement,
  setDiscussionRequirement,

  // Posts
  getPosts,
  getPostById,
  createPost,
  updatePost,
  hidePost,
  unhidePost,

  // Participation
  checkRequirementMet,
  getParticipationStatus,

  // Coach views
  getPostsForModeration,
  getCohortParticipationSummary,
};

