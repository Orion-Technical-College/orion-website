"use client";

/**
 * Discussion Forum Component
 *
 * Displays discussion threads with post/reply functionality.
 * Tracks participation requirements (ELITE: post + reply to at least 1 peer).
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  CheckCircle2,
  Send,
  Reply,
  User,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

// ============================================
// Types
// ============================================

interface Author {
  id: string;
  name: string;
  email: string;
}

interface DiscussionPost {
  id: string;
  authorId: string;
  author: Author;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DiscussionThread {
  post: DiscussionPost;
  replies: DiscussionPost[];
  replyCount: number;
}

interface ParticipationStatus {
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

interface DiscussionForumProps {
  courseId: string;
  moduleId: string;
  itemId: string;
  enrollmentId: string;
  userId: string;
  onComplete?: () => void;
  nextItemPath?: string;
}

// ============================================
// Sub-Components
// ============================================

function ParticipationBadge({
  status,
}: {
  status: ParticipationStatus | null;
}) {
  if (!status) return null;

  const { postCount, replyCount, requirementMet, requirement } = status;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        requirementMet
          ? "bg-green-950/30 border-green-800/50"
          : "bg-amber-950/30 border-amber-800/50"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {requirementMet ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="font-medium text-green-400">
              Requirements Met!
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <span className="font-medium text-amber-400">
              Complete Participation
            </span>
          </>
        )}
      </div>
      <div className="text-sm text-zinc-400 space-y-1">
        <p>
          Posts: {postCount} {requirement.requirePost && postCount === 0 && "(Need 1)"}
        </p>
        <p>
          Replies to peers: {replyCount}{" "}
          {replyCount < requirement.minReplies &&
            `(Need ${requirement.minReplies})`}
        </p>
      </div>
    </div>
  );
}

function PostCard({
  post,
  currentUserId,
  onReply,
  isReply = false,
}: {
  post: DiscussionPost;
  currentUserId: string;
  onReply: (postId: string) => void;
  isReply?: boolean;
}) {
  const isOwnPost = post.authorId === currentUserId;
  const initials = post.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        isReply ? "bg-zinc-900/30 border-zinc-800" : "bg-zinc-900/50 border-zinc-800",
        isOwnPost && "border-purple-800/50"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-zinc-700 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-zinc-200">
              {post.author.name}
            </span>
            {isOwnPost && (
              <span className="text-xs text-purple-400">(You)</span>
            )}
            <span className="text-xs text-zinc-500">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-zinc-300 whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>

      {!isReply && !isOwnPost && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(post.id)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <Reply className="h-4 w-4 mr-1" />
            Reply
          </Button>
        </div>
      )}
    </div>
  );
}

function ThreadCard({
  thread,
  currentUserId,
  onReply,
}: {
  thread: DiscussionThread;
  currentUserId: string;
  onReply: (postId: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className="space-y-3">
      <PostCard
        post={thread.post}
        currentUserId={currentUserId}
        onReply={onReply}
      />

      {thread.replies.length > 0 && (
        <div className="ml-8 space-y-3">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-sm text-zinc-500 hover:text-zinc-400"
          >
            {showReplies ? "Hide" : "Show"} {thread.replies.length}{" "}
            {thread.replies.length === 1 ? "reply" : "replies"}
          </button>

          {showReplies &&
            thread.replies.map((reply) => (
              <PostCard
                key={reply.id}
                post={reply}
                currentUserId={currentUserId}
                onReply={onReply}
                isReply
              />
            ))}
        </div>
      )}
    </div>
  );
}

function NewPostForm({
  onSubmit,
  replyingTo,
  onCancelReply,
  submitting,
}: {
  onSubmit: (content: string, parentId?: string) => void;
  replyingTo: { id: string; authorName: string } | null;
  onCancelReply: () => void;
  submitting: boolean;
}) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim(), replyingTo?.id);
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyingTo && (
        <div className="flex items-center justify-between text-sm bg-zinc-800/50 p-2 rounded">
          <span className="text-zinc-400">
            Replying to <span className="text-zinc-200">{replyingTo.authorName}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
          >
            Cancel
          </Button>
        </div>
      )}

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          replyingTo
            ? "Write your reply..."
            : "Share your thoughts with the community..."
        }
        className="min-h-[100px] bg-zinc-900/50 border-zinc-700"
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={!content.trim() || submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {replyingTo ? "Post Reply" : "Post"}
        </Button>
      </div>
    </form>
  );
}

// ============================================
// Main Component
// ============================================

export function DiscussionForum({
  courseId,
  moduleId,
  itemId,
  enrollmentId,
  userId,
  onComplete,
  nextItemPath,
}: DiscussionForumProps) {
  const router = useRouter();
  const [item, setItem] = useState<{ name: string; description: string | null } | null>(null);
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [participation, setParticipation] = useState<ParticipationStatus | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch item info
        const itemRes = await fetch(`/api/elite/items/${itemId}`);
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          setItem({ name: itemData.name, description: itemData.description });
        }

        // Fetch discussion threads
        const threadsRes = await fetch(
          `/api/elite/items/${itemId}/discussion`
        );
        if (threadsRes.ok) {
          const threadsData = await threadsRes.json();
          setThreads(threadsData.threads || []);
        }

        // Fetch participation status
        const participationRes = await fetch(
          `/api/elite/items/${itemId}/discussion/participation?enrollmentId=${enrollmentId}`
        );
        if (participationRes.ok) {
          const participationData = await participationRes.json();
          setParticipation(participationData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load discussion");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [itemId, enrollmentId]);

  const handlePost = async (content: string, parentId?: string) => {
    try {
      setSubmitting(true);

      const res = await fetch(`/api/elite/items/${itemId}/discussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId, enrollmentId }),
      });

      if (!res.ok) throw new Error("Failed to post");

      const newPost = await res.json();

      // Update threads locally
      if (parentId) {
        // Add reply to existing thread
        setThreads((prev) =>
          prev.map((thread) => {
            if (thread.post.id === parentId) {
              return {
                ...thread,
                replies: [...thread.replies, newPost],
                replyCount: thread.replyCount + 1,
              };
            }
            return thread;
          })
        );
      } else {
        // Add new thread
        setThreads((prev) => [
          { post: newPost, replies: [], replyCount: 0 },
          ...prev,
        ]);
      }

      // Refresh participation status
      const participationRes = await fetch(
        `/api/elite/items/${itemId}/discussion/participation?enrollmentId=${enrollmentId}`
      );
      if (participationRes.ok) {
        const participationData = await participationRes.json();
        setParticipation(participationData);

        if (participationData.requirementMet && !participation?.requirementMet) {
          onComplete?.();
        }
      }

      setReplyingTo(null);
    } catch (err) {
      console.error("Failed to post:", err);
      setError("Failed to post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (postId: string) => {
    const thread = threads.find((t) => t.post.id === postId);
    if (thread) {
      setReplyingTo({ id: postId, authorName: thread.post.author.name });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
          <MessageSquare className="h-4 w-4" />
          <span>Discuss It</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">
          {item?.name || "Discussion"}
        </h1>
        {item?.description && (
          <p className="text-zinc-400 mt-2">{item.description}</p>
        )}
      </div>

      {/* Participation Status */}
      <div className="mb-6">
        <ParticipationBadge status={participation} />
      </div>

      {/* New Post Form */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">
          {threads.length === 0
            ? "Start the Discussion"
            : "Share Your Thoughts"}
        </h3>
        <NewPostForm
          onSubmit={handlePost}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          submitting={submitting}
        />
      </div>

      {/* Threads */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-zinc-100">
          Discussion ({threads.length} {threads.length === 1 ? "post" : "posts"})
        </h3>

        {threads.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No posts yet. Be the first to start the discussion!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.post.id}
                thread={thread}
                currentUserId={userId}
                onReply={handleReply}
              />
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      {participation?.requirementMet && nextItemPath && (
        <div className="mt-8 flex justify-end">
          <Button onClick={() => router.push(nextItemPath)}>
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

