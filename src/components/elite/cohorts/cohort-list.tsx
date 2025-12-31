"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Plus,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useEliteContext, useElitePermission } from "@/components/elite/layout";
import { ELITE_PERMISSIONS } from "@/lib/elite/permissions";
import { CreateCohortDialog } from "./create-cohort-dialog";

interface Cohort {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  programTemplate: {
    id: string;
    name: string;
  };
  orgUnit: {
    id: string;
    name: string;
  } | null;
  _count: {
    members: number;
    sessions: number;
  };
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ARCHIVED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function CohortList() {
  const { context } = useEliteContext();
  const canManage = useElitePermission(ELITE_PERMISSIONS.MANAGE_COHORTS);
  
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/elite/cohorts");
      if (!res.ok) {
        throw new Error("Failed to fetch cohorts");
      }
      const data = await res.json();
      setCohorts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  const handleCohortCreated = () => {
    setShowCreateDialog(false);
    fetchCohorts();
  };

  if (!context) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cohorts</h1>
          <p className="text-foreground-muted">
            Manage cohorts and their members
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Cohort
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="py-4 flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={fetchCohorts}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
        </div>
      )}

      {/* Cohort list */}
      {!loading && !error && cohorts.length > 0 && (
        <div className="grid gap-4">
          {cohorts.map((cohort) => (
            <Link
              key={cohort.id}
              href={`/elite/cohorts/${cohort.id}`}
              className="block"
            >
              <Card className="hover:bg-background-tertiary transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">
                          {cohort.name}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            STATUS_COLORS[cohort.status] ?? STATUS_COLORS.DRAFT
                          }`}
                        >
                          {cohort.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {cohort.programTemplate.name}
                        {cohort.orgUnit && ` • ${cohort.orgUnit.name}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-foreground-muted">
                          <Users className="h-4 w-4" />
                          <span>{cohort._count.members} members</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-foreground-muted">
                          <Calendar className="h-4 w-4" />
                          <span>{cohort._count.sessions} sessions</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-foreground-muted" />
                    </div>
                  </div>

                  {(cohort.startDate || cohort.endDate) && (
                    <div className="mt-2 text-xs text-foreground-muted">
                      {cohort.startDate && (
                        <span>
                          Starts{" "}
                          {new Date(cohort.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {cohort.startDate && cohort.endDate && " • "}
                      {cohort.endDate && (
                        <span>
                          Ends {new Date(cohort.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && cohorts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Cohorts Yet
            </h3>
            <p className="text-foreground-muted max-w-sm mx-auto mb-4">
              {canManage
                ? "Create your first cohort to get started with leadership training."
                : "You haven't been assigned to any cohorts yet."}
            </p>
            {canManage && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Cohort
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Cohort Dialog */}
      {showCreateDialog && (
        <CreateCohortDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleCohortCreated}
        />
      )}
    </div>
  );
}
