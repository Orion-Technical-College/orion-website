"use client";

/**
 * Read It Viewer Component
 *
 * Displays lesson content and tracks view completion.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================
// Types
// ============================================

interface ReadItContent {
  sections: {
    id: string;
    title: string;
    content: string; // HTML or markdown
    videoUrl?: string;
    imageUrl?: string;
  }[];
  estimatedMinutes?: number;
}

interface CourseItem {
  id: string;
  name: string;
  description: string | null;
  itemType: string;
  completionRule: string;
  content: string | null;
}

interface ReadItViewerProps {
  courseId: string;
  moduleId: string;
  itemId: string;
  enrollmentId: string;
  onComplete?: () => void;
  nextItemPath?: string;
}

// ============================================
// Content Section Component
// ============================================

function ContentSection({
  section,
  isLast,
}: {
  section: ReadItContent["sections"][0];
  isLast: boolean;
}) {
  return (
    <div className="space-y-4">
      {section.title && (
        <h2 className="text-xl font-semibold text-zinc-100">{section.title}</h2>
      )}

      {section.imageUrl && (
        <div className="rounded-lg overflow-hidden border border-zinc-700">
          <img
            src={section.imageUrl}
            alt={section.title || "Content image"}
            className="w-full h-auto"
          />
        </div>
      )}

      {section.videoUrl && (
        <div className="aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700">
          <iframe
            src={section.videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div
        className="prose prose-invert prose-zinc max-w-none"
        dangerouslySetInnerHTML={{ __html: section.content }}
      />

      {!isLast && <hr className="border-zinc-800 my-8" />}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ReadItViewer({
  courseId,
  moduleId,
  itemId,
  enrollmentId,
  onComplete,
  nextItemPath,
}: ReadItViewerProps) {
  const router = useRouter();
  const [item, setItem] = useState<CourseItem | null>(null);
  const [content, setContent] = useState<ReadItContent | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      try {
        setLoading(true);

        // Fetch item data
        const res = await fetch(`/api/elite/items/${itemId}`);
        if (!res.ok) throw new Error("Failed to load content");
        const data = await res.json();
        setItem(data);

        // Parse content
        if (data.content) {
          try {
            const parsed = JSON.parse(data.content);
            setContent(parsed);
          } catch {
            // If content is not JSON, treat as single section
            setContent({
              sections: [
                { id: "main", title: "", content: data.content },
              ],
            });
          }
        }

        // Check if already completed
        const progressRes = await fetch(
          `/api/elite/items/${itemId}/progress?enrollmentId=${enrollmentId}`
        );
        if (progressRes.ok) {
          const progress = await progressRes.json();
          setIsCompleted(progress.status === "COMPLETED");
        }

        // Mark as viewed immediately (for VIEW completion rule)
        await fetch(`/api/elite/items/${itemId}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollmentId }),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [itemId, enrollmentId]);

  const handleMarkComplete = async () => {
    try {
      setMarkingComplete(true);

      const res = await fetch(`/api/elite/items/${itemId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });

      if (!res.ok) throw new Error("Failed to mark as complete");

      setIsCompleted(true);
      onComplete?.();
    } catch (err) {
      console.error("Failed to mark complete:", err);
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleNext = () => {
    if (content && currentSection < content.sections.length - 1) {
      setCurrentSection((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (nextItemPath) {
      router.push(nextItemPath);
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error || "Content not found"}</p>
      </div>
    );
  }

  const sections = content?.sections || [];
  const totalSections = sections.length;
  const isLastSection = currentSection >= totalSections - 1;
  const showPagination = totalSections > 1;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
          <BookOpen className="h-4 w-4" />
          <span>Read It</span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">{item.name}</h1>
        {item.description && (
          <p className="text-zinc-400 mt-2">{item.description}</p>
        )}
        {content?.estimatedMinutes && (
          <p className="text-sm text-zinc-500 mt-2">
            ~{content.estimatedMinutes} min read
          </p>
        )}
      </div>

      {/* Progress Bar (for multi-section content) */}
      {showPagination && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-400">
              Section {currentSection + 1} of {totalSections}
            </span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${((currentSection + 1) / totalSections) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 md:p-8">
        {sections.length > 0 ? (
          showPagination ? (
            <ContentSection
              section={sections[currentSection]}
              isLast={isLastSection}
            />
          ) : (
            sections.map((section, index) => (
              <ContentSection
                key={section.id}
                section={section}
                isLast={index === sections.length - 1}
              />
            ))
          )
        ) : (
          <p className="text-zinc-400">No content available.</p>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        {showPagination ? (
          <>
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentSection === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {isLastSection ? (
              <div className="flex items-center gap-3">
                {!isCompleted && item.completionRule === "MARK_DONE" && (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={markingComplete}
                  >
                    {markingComplete ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Mark as Done
                  </Button>
                )}
                {nextItemPath && (
                  <Button onClick={handleNext}>
                    Next Item
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={handleNext}>
                Next Section
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 ml-auto">
            {!isCompleted && item.completionRule === "MARK_DONE" && (
              <Button onClick={handleMarkComplete} disabled={markingComplete}>
                {markingComplete ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Mark as Done
              </Button>
            )}
            {nextItemPath && (
              <Button onClick={handleNext}>
                Next Item
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

