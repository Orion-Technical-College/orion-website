"use client";

/**
 * Course Map Component
 *
 * Displays the course structure with modules and items,
 * showing progress checkmarks and completion status.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Lock,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Brain,
  MessageSquare,
  Dumbbell,
  Trophy,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ============================================
// Types
// ============================================

interface CourseItem {
  id: string;
  name: string;
  itemType: string;
  completionRule: string;
  sortOrder: number;
}

interface CourseModule {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  items: CourseItem[];
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  modules: CourseModule[];
}

interface ItemProgressData {
  itemId: string;
  status: string;
  completedAt: string | null;
}

interface ModuleCompletionStatus {
  moduleId: string;
  status: string;
  totalItems: number;
  completedItems: number;
  percentComplete: number;
  canAccess: boolean;
}

interface CourseMapProps {
  courseId: string;
  enrollmentId: string;
}

// ============================================
// Item Type Icons
// ============================================

const ITEM_TYPE_ICONS: Record<string, React.ElementType> = {
  READ: BookOpen,
  LEARN: Brain,
  DISCUSS: MessageSquare,
  PRACTICE: Dumbbell,
  DEMONSTRATE: Trophy,
  SURVEY: ClipboardList,
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  READ: "Read It",
  LEARN: "Learn It",
  DISCUSS: "Discuss It",
  PRACTICE: "Practice It",
  DEMONSTRATE: "Demonstrate It",
  SURVEY: "Survey",
};

const ITEM_TYPE_COLORS: Record<string, string> = {
  READ: "text-blue-500",
  LEARN: "text-purple-500",
  DISCUSS: "text-green-500",
  PRACTICE: "text-orange-500",
  DEMONSTRATE: "text-amber-500",
  SURVEY: "text-cyan-500",
};

// ============================================
// Sub-Components
// ============================================

function ItemStatusIcon({
  status,
  canAccess,
}: {
  status: string;
  canAccess: boolean;
}) {
  if (!canAccess) {
    return <Lock className="h-5 w-5 text-zinc-500" />;
  }

  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "IN_PROGRESS":
      return <Circle className="h-5 w-5 text-amber-500 fill-amber-500/20" />;
    default:
      return <Circle className="h-5 w-5 text-zinc-400" />;
  }
}

function ItemCard({
  item,
  status,
  canAccess,
  courseId,
  moduleId,
}: {
  item: CourseItem;
  status: string;
  canAccess: boolean;
  courseId: string;
  moduleId: string;
}) {
  const router = useRouter();
  const Icon = ITEM_TYPE_ICONS[item.itemType] || Circle;
  const typeLabel = ITEM_TYPE_LABELS[item.itemType] || item.itemType;
  const typeColor = ITEM_TYPE_COLORS[item.itemType] || "text-zinc-500";

  const handleClick = () => {
    if (canAccess) {
      router.push(
        `/elite/course/${courseId}/module/${moduleId}/item/${item.id}`
      );
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        canAccess
          ? "cursor-pointer hover:bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600"
          : "cursor-not-allowed opacity-50 border-zinc-800",
        status === "COMPLETED" && "bg-green-950/20 border-green-900/30"
      )}
    >
      <ItemStatusIcon status={status} canAccess={canAccess} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", typeColor)} />
          <span className={cn("text-xs font-medium", typeColor)}>
            {typeLabel}
          </span>
        </div>
        <p className="text-sm font-medium text-zinc-200 truncate mt-0.5">
          {item.name}
        </p>
      </div>
      {canAccess && status !== "COMPLETED" && (
        <ChevronRight className="h-4 w-4 text-zinc-500" />
      )}
    </div>
  );
}

function ModuleCard({
  module,
  moduleStatus,
  itemProgress,
  courseId,
  isExpanded,
  onToggle,
}: {
  module: CourseModule;
  moduleStatus: ModuleCompletionStatus | undefined;
  itemProgress: Map<string, string>;
  courseId: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const status = moduleStatus?.status || "NOT_STARTED";
  const canAccess = moduleStatus?.canAccess ?? true;
  const completedItems = moduleStatus?.completedItems || 0;
  const totalItems = moduleStatus?.totalItems || module.items.length;
  const percentComplete = moduleStatus?.percentComplete || 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className={cn(
          "rounded-xl border overflow-hidden transition-all",
          canAccess ? "border-zinc-700/50" : "border-zinc-800 opacity-60",
          status === "COMPLETED" && "border-green-900/50 bg-green-950/10"
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-4 p-4 text-left transition-colors",
              canAccess
                ? "hover:bg-zinc-800/50"
                : "cursor-not-allowed"
            )}
            disabled={!canAccess}
          >
            <div className="flex-shrink-0">
              {!canAccess ? (
                <Lock className="h-6 w-6 text-zinc-500" />
              ) : status === "COMPLETED" ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <div className="relative h-6 w-6">
                  <svg className="h-6 w-6 -rotate-90">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-zinc-700"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${percentComplete * 0.628} 62.8`}
                      className="text-purple-500"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-zinc-100">{module.name}</h3>
              {module.description && (
                <p className="text-sm text-zinc-400 truncate mt-0.5">
                  {module.description}
                </p>
              )}
              <p className="text-xs text-zinc-500 mt-1">
                {completedItems} of {totalItems} items completed
              </p>
            </div>

            {canAccess && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-zinc-400" />
                )}
              </div>
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {module.items
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  status={itemProgress.get(item.id) || "NOT_STARTED"}
                  canAccess={canAccess}
                  courseId={courseId}
                  moduleId={module.id}
                />
              ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// Main Component
// ============================================

export function CourseMap({ courseId, enrollmentId }: CourseMapProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [moduleStatuses, setModuleStatuses] = useState<ModuleCompletionStatus[]>([]);
  const [itemProgress, setItemProgress] = useState<Map<string, string>>(new Map());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourseData() {
      try {
        setLoading(true);

        // Fetch course structure
        const courseRes = await fetch(`/api/elite/courses/${courseId}`);
        if (!courseRes.ok) throw new Error("Failed to load course");
        const courseData = await courseRes.json();
        setCourse(courseData);

        // Fetch module completion status
        const statusRes = await fetch(
          `/api/elite/enrollments/${enrollmentId}/progress?courseId=${courseId}`
        );
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setModuleStatuses(statusData.modules || []);

          // Build item progress map
          const progressMap = new Map<string, string>();
          for (const item of statusData.items || []) {
            progressMap.set(item.itemId, item.status);
          }
          setItemProgress(progressMap);
        }

        // Auto-expand first non-completed module
        const firstIncomplete = courseData.modules?.find(
          (m: CourseModule) => {
            const status = moduleStatuses.find((s) => s.moduleId === m.id);
            return status?.status !== "COMPLETED" && status?.canAccess;
          }
        );
        if (firstIncomplete) {
          setExpandedModules(new Set([firstIncomplete.id]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [courseId, enrollmentId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error || "Course not found"}</p>
      </div>
    );
  }

  // Calculate overall progress
  const totalModules = course.modules.length;
  const completedModules = moduleStatuses.filter(
    (s) => s.status === "COMPLETED"
  ).length;
  const overallPercent =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-6 border border-purple-800/30">
        <h1 className="text-2xl font-bold text-zinc-100">{course.name}</h1>
        {course.description && (
          <p className="text-zinc-400 mt-2">{course.description}</p>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-400">Overall Progress</span>
            <span className="text-zinc-300 font-medium">
              {completedModules} of {totalModules} modules • {overallPercent}%
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {course.modules
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              moduleStatus={moduleStatuses.find(
                (s) => s.moduleId === module.id
              )}
              itemProgress={itemProgress}
              courseId={courseId}
              isExpanded={expandedModules.has(module.id)}
              onToggle={() => toggleModule(module.id)}
            />
          ))}
      </div>
    </div>
  );
}

