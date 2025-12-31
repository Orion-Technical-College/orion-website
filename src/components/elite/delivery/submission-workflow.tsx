"use client";

/**
 * Submission Workflow Component
 *
 * Handles the full submission lifecycle for Demonstrate It items:
 * Submit → Review → Approve/Needs Revision → Resubmit
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  CheckCircle2,
  Upload,
  FileText,
  AlertCircle,
  Clock,
  Send,
  RefreshCw,
  MessageSquare,
  Loader2,
  ChevronRight,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";

// ============================================
// Types
// ============================================

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate: string | null;
  maxAttempts: number;
  requiresApproval: boolean;
}

interface Artifact {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

interface Submission {
  id: string;
  artifactId: string | null;
  artifact: Artifact | null;
  content: string | null;
  attemptNumber: number;
  status: "SUBMITTED" | "NEEDS_REVISION" | "APPROVED";
  feedback: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}

interface SubmissionWorkflowProps {
  courseId: string;
  moduleId: string;
  itemId: string;
  enrollmentId: string;
  onComplete?: () => void;
  nextItemPath?: string;
}

// ============================================
// Status Badge Component
// ============================================

function StatusBadge({ status }: { status: Submission["status"] }) {
  const config = {
    SUBMITTED: {
      icon: Clock,
      label: "Awaiting Review",
      className: "bg-blue-950/50 text-blue-400 border-blue-800/50",
    },
    NEEDS_REVISION: {
      icon: AlertCircle,
      label: "Needs Revision",
      className: "bg-amber-950/50 text-amber-400 border-amber-800/50",
    },
    APPROVED: {
      icon: CheckCircle2,
      label: "Approved",
      className: "bg-green-950/50 text-green-400 border-green-800/50",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

// ============================================
// Submission Form Component
// ============================================

function SubmissionForm({
  assignment,
  currentAttempt,
  maxAttempts,
  onSubmit,
  submitting,
}: {
  assignment: Assignment;
  currentAttempt: number;
  maxAttempts: number;
  onSubmit: (file: File, content: string) => void;
  submitting: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onSubmit(file, content);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Instructions */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
        <h3 className="font-medium text-zinc-100 mb-2">Instructions</h3>
        <div
          className="prose prose-invert prose-sm max-w-none text-zinc-300"
          dangerouslySetInnerHTML={{ __html: assignment.instructions }}
        />
      </div>

      {/* File Upload */}
      <div>
        <Label className="text-zinc-200 mb-2 block">Upload Your Work</Label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive
              ? "border-amber-500 bg-amber-950/20"
              : "border-zinc-700 hover:border-zinc-600"
          )}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-amber-400" />
              <div className="text-left">
                <p className="font-medium text-zinc-100">{file.name}</p>
                <p className="text-sm text-zinc-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-400 mb-2">
                Drag and drop your file here, or{" "}
                <label className="text-amber-400 cursor-pointer hover:underline">
                  browse
                  <Input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx"
                  />
                </label>
              </p>
              <p className="text-sm text-zinc-500">
                Supported: PDF, Word, Excel, PowerPoint
              </p>
            </>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <Label className="text-zinc-200 mb-2 block">
          Additional Notes (Optional)
        </Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add any notes or comments about your submission..."
          className="bg-zinc-900/50 border-zinc-700"
        />
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Attempt {currentAttempt} of {maxAttempts}
        </p>
        <Button type="submit" disabled={!file || submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Submit for Review
        </Button>
      </div>
    </form>
  );
}

// ============================================
// Submission History Component
// ============================================

function SubmissionHistory({
  submissions,
  onResubmit,
}: {
  submissions: Submission[];
  onResubmit?: () => void;
}) {
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {submissions.map((submission, index) => (
        <div
          key={submission.id}
          className={cn(
            "p-4 rounded-lg border",
            submission.status === "APPROVED"
              ? "bg-green-950/20 border-green-900/50"
              : submission.status === "NEEDS_REVISION"
              ? "bg-amber-950/20 border-amber-900/50"
              : "bg-zinc-900/50 border-zinc-800"
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium text-zinc-100">
                Attempt #{submission.attemptNumber}
              </p>
              <p className="text-sm text-zinc-500">
                Submitted{" "}
                {formatDistanceToNow(new Date(submission.submittedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <StatusBadge status={submission.status} />
          </div>

          {submission.artifact && (
            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded mb-3">
              <FileText className="h-5 w-5 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {submission.artifact.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatFileSize(submission.artifact.sizeBytes)}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={submission.artifact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}

          {submission.feedback && (
            <div className="p-3 bg-zinc-800/30 rounded border-l-2 border-amber-500">
              <p className="text-sm font-medium text-zinc-300 mb-1 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Coach Feedback
              </p>
              <p className="text-sm text-zinc-400">{submission.feedback}</p>
            </div>
          )}

          {submission.status === "NEEDS_REVISION" &&
            index === 0 &&
            onResubmit && (
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <Button onClick={onResubmit} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resubmit
                </Button>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function SubmissionWorkflow({
  courseId,
  moduleId,
  itemId,
  enrollmentId,
  onComplete,
  nextItemPath,
}: SubmissionWorkflowProps) {
  const router = useRouter();
  const [item, setItem] = useState<{ name: string; description: string | null } | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showForm, setShowForm] = useState(true);
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

        // Fetch assignment for this item
        const assignmentRes = await fetch(
          `/api/elite/items/${itemId}/assignment`
        );
        if (assignmentRes.ok) {
          const assignmentData = await assignmentRes.json();
          setAssignment(assignmentData);

          // Fetch submission history
          if (assignmentData.id) {
            const submissionsRes = await fetch(
              `/api/elite/submissions?assignmentId=${assignmentData.id}&enrollmentId=${enrollmentId}`
            );
            if (submissionsRes.ok) {
              const submissionsData = await submissionsRes.json();
              setSubmissions(submissionsData.submissions || []);

              // Hide form if there's a pending or approved submission
              const latestSubmission = submissionsData.submissions?.[0];
              if (
                latestSubmission?.status === "SUBMITTED" ||
                latestSubmission?.status === "APPROVED"
              ) {
                setShowForm(false);
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assignment");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [itemId, enrollmentId]);

  const handleSubmit = async (file: File, content: string) => {
    if (!assignment) return;

    try {
      setSubmitting(true);

      // First, upload the file as an artifact
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/elite/artifacts/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file");
      const artifact = await uploadRes.json();

      // Then create the submission
      const submissionRes = await fetch("/api/elite/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment.id,
          artifactId: artifact.id,
          content,
          enrollmentId,
        }),
      });

      if (!submissionRes.ok) throw new Error("Failed to submit");
      const newSubmission = await submissionRes.json();

      setSubmissions((prev) => [newSubmission, ...prev]);
      setShowForm(false);
    } catch (err) {
      console.error("Failed to submit:", err);
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = () => {
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error || "Assignment not found"}</p>
      </div>
    );
  }

  const latestSubmission = submissions[0];
  const isApproved = latestSubmission?.status === "APPROVED";
  const isPending = latestSubmission?.status === "SUBMITTED";
  const needsRevision = latestSubmission?.status === "NEEDS_REVISION";
  const currentAttempt = submissions.length + 1;
  const canSubmit = currentAttempt <= assignment.maxAttempts;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
          <Trophy className="h-4 w-4" />
          <span>Demonstrate It</span>
          {isApproved && (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">
          {item?.name || assignment.title}
        </h1>
        {item?.description && (
          <p className="text-zinc-400 mt-2">{item.description}</p>
        )}
        {assignment.dueDate && (
          <p className="text-sm text-zinc-500 mt-2">
            Due:{" "}
            {new Date(assignment.dueDate).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Status Banner */}
      {isApproved && (
        <div className="mb-6 p-4 rounded-lg bg-green-950/30 border border-green-800/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <div>
              <p className="font-medium text-green-400">
                Submission Approved!
              </p>
              <p className="text-sm text-zinc-400">
                Great work! Your submission has been approved by your coach.
              </p>
            </div>
          </div>
        </div>
      )}

      {isPending && (
        <div className="mb-6 p-4 rounded-lg bg-blue-950/30 border border-blue-800/50">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-400" />
            <div>
              <p className="font-medium text-blue-400">Awaiting Review</p>
              <p className="text-sm text-zinc-400">
                Your submission is being reviewed by your coach.
              </p>
            </div>
          </div>
        </div>
      )}

      {needsRevision && (
        <div className="mb-6 p-4 rounded-lg bg-amber-950/30 border border-amber-800/50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-400" />
            <div>
              <p className="font-medium text-amber-400">Revision Requested</p>
              <p className="text-sm text-zinc-400">
                Please review your coach&apos;s feedback and resubmit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submission Form */}
      {showForm && canSubmit && !isPending && !isApproved && (
        <div className="mb-8">
          <SubmissionForm
            assignment={assignment}
            currentAttempt={currentAttempt}
            maxAttempts={assignment.maxAttempts}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>
      )}

      {/* Submission History */}
      {submissions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Submission History
          </h3>
          <SubmissionHistory
            submissions={submissions}
            onResubmit={needsRevision && canSubmit ? handleResubmit : undefined}
          />
        </div>
      )}

      {/* Navigation */}
      {isApproved && nextItemPath && (
        <div className="flex justify-end">
          <Button onClick={() => router.push(nextItemPath)}>
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

