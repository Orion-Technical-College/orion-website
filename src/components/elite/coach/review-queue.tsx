"use client";

/**
 * Coach Review Queue Component
 *
 * Displays submissions needing review and learners at risk (below quiz thresholds).
 */

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Brain,
  Trophy,
  MessageSquare,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

// ============================================
// Types
// ============================================

interface Learner {
  id: string;
  name: string;
  email: string;
}

interface Artifact {
  id: string;
  name: string;
  url: string;
}

interface Assignment {
  id: string;
  title: string;
}

interface PendingSubmission {
  id: string;
  learner: Learner;
  assignment: Assignment;
  artifact: Artifact | null;
  content: string | null;
  attemptNumber: number;
  submittedAt: string;
}

interface AtRiskLearner {
  userId: string;
  userName: string;
  userEmail: string;
  itemId: string;
  itemName: string;
  attempts: number;
  bestScore: number;
  passed: boolean;
  lastAttemptAt: string | null;
}

interface ReviewQueueProps {
  cohortId: string;
}

// ============================================
// Review Dialog Component
// ============================================

function ReviewDialog({
  submission,
  open,
  onClose,
  onReview,
}: {
  submission: PendingSubmission | null;
  open: boolean;
  onClose: () => void;
  onReview: (submissionId: string, status: "APPROVED" | "NEEDS_REVISION", feedback: string) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async (status: "APPROVED" | "NEEDS_REVISION") => {
    if (!submission) return;
    setSubmitting(true);
    await onReview(submission.id, status, feedback);
    setSubmitting(false);
    setFeedback("");
    onClose();
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Submission</DialogTitle>
          <DialogDescription>
            {submission.assignment.title} - Attempt #{submission.attemptNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Learner Info */}
          <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {submission.learner.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-zinc-100">
                {submission.learner.name}
              </p>
              <p className="text-sm text-zinc-400">{submission.learner.email}</p>
            </div>
          </div>

          {/* Artifact */}
          {submission.artifact && (
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <p className="text-sm text-zinc-400 mb-2">Submitted File:</p>
              <a
                href={submission.artifact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:underline"
              >
                <FileText className="h-4 w-4" />
                {submission.artifact.name}
              </a>
            </div>
          )}

          {/* Content */}
          {submission.content && (
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <p className="text-sm text-zinc-400 mb-2">Learner Notes:</p>
              <p className="text-zinc-200">{submission.content}</p>
            </div>
          )}

          {/* Feedback */}
          <div>
            <label className="text-sm text-zinc-300 mb-2 block">
              Your Feedback
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback for the learner..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleReview("NEEDS_REVISION")}
            disabled={submitting}
          >
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
            Request Revision
          </Button>
          <Button
            onClick={() => handleReview("APPROVED")}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Submission Card Component
// ============================================

function SubmissionCard({
  submission,
  onReview,
}: {
  submission: PendingSubmission;
  onReview: (submission: PendingSubmission) => void;
}) {
  const initials = submission.learner.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-zinc-700 text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-zinc-100">
              {submission.learner.name}
            </p>
            <p className="text-sm text-zinc-400">
              {submission.assignment.title}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(submission.submittedAt), {
                addSuffix: true,
              })}
              <span>•</span>
              <span>Attempt #{submission.attemptNumber}</span>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => onReview(submission)}>
          Review
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// At Risk Learner Card Component
// ============================================

function AtRiskCard({ learner }: { learner: AtRiskLearner }) {
  const initials = learner.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const scoreColor =
    learner.bestScore < 50
      ? "text-red-400"
      : learner.bestScore < 70
      ? "text-amber-400"
      : "text-zinc-400";

  return (
    <div className="p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-zinc-700 text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-zinc-100">{learner.userName}</p>
          <p className="text-sm text-zinc-400">{learner.itemName}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className={cn("text-sm font-medium", scoreColor)}>
                {learner.bestScore}%
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              {learner.attempts} {learner.attempts === 1 ? "attempt" : "attempts"}
            </span>
            {learner.lastAttemptAt && (
              <span className="text-xs text-zinc-500">
                Last:{" "}
                {formatDistanceToNow(new Date(learner.lastAttemptAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ReviewQueue({ cohortId }: ReviewQueueProps) {
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [atRiskLearners, setAtRiskLearners] = useState<AtRiskLearner[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pending submissions
      const submissionsRes = await fetch(
        `/api/elite/submissions/review-queue?cohortId=${cohortId}`
      );
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setPendingSubmissions(data.submissions || []);
      }

      // Fetch at-risk learners
      const atRiskRes = await fetch(
        `/api/elite/cohorts/${cohortId}/at-risk`
      );
      if (atRiskRes.ok) {
        const data = await atRiskRes.json();
        setAtRiskLearners(data.learners || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cohortId]);

  const handleReview = async (
    submissionId: string,
    status: "APPROVED" | "NEEDS_REVISION",
    feedback: string
  ) => {
    try {
      const res = await fetch(`/api/elite/submissions/${submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback }),
      });

      if (!res.ok) throw new Error("Failed to submit review");

      // Remove from pending list
      setPendingSubmissions((prev) =>
        prev.filter((s) => s.id !== submissionId)
      );
    } catch (err) {
      console.error("Failed to review:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-100">Coach Dashboard</h2>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-900/50">
              <Trophy className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {pendingSubmissions.length}
              </p>
              <p className="text-sm text-zinc-400">Pending Reviews</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-900/50">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">
                {atRiskLearners.length}
              </p>
              <p className="text-sm text-zinc-400">At Risk Learners</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-green-950/30 border border-green-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-900/50">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">0</p>
              <p className="text-sm text-zinc-400">Reviewed Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions" className="gap-2">
            <Trophy className="h-4 w-4" />
            Submissions ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="at-risk" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            At Risk ({atRiskLearners.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-3">
          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No submissions pending review</p>
            </div>
          ) : (
            pendingSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onReview={setSelectedSubmission}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="at-risk" className="space-y-3">
          {atRiskLearners.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>All learners are on track!</p>
            </div>
          ) : (
            atRiskLearners.map((learner) => (
              <AtRiskCard
                key={`${learner.userId}-${learner.itemId}`}
                learner={learner}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <ReviewDialog
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onReview={handleReview}
      />
    </div>
  );
}

