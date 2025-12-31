"use client";

import React from "react";
import { useEliteContext } from "@/components/elite/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, GraduationCap, TrendingUp } from "lucide-react";

/**
 * ELITE Dashboard Page
 */
export default function EliteDashboardPage() {
  const { context } = useEliteContext();

  if (!context) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {context.user.name.split(" ")[0]}
        </h1>
        <p className="text-foreground-muted">
          {context.effectiveRole} • {context.tenantName}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-muted">
              Active Cohorts
            </CardTitle>
            <Users className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {context.cohortAccess.length}
            </div>
            <p className="text-xs text-foreground-muted">
              Cohorts you have access to
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-muted">
              Upcoming Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">-</div>
            <p className="text-xs text-foreground-muted">
              Sessions this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-muted">
              Learners
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">-</div>
            <p className="text-xs text-foreground-muted">
              Active learners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-muted">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">-</div>
            <p className="text-xs text-foreground-muted">
              Average across cohorts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Access List */}
      {context.cohortAccess.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Cohorts</CardTitle>
            <CardDescription>
              Cohorts you are assigned to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {context.cohortAccess.map((cohort) => (
                <a
                  key={cohort.cohortId}
                  href={`/elite/cohorts/${cohort.cohortId}`}
                  className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-background-tertiary transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {cohort.cohortName}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      {cohort.memberRole}
                    </p>
                  </div>
                  <svg
                    className="h-4 w-4 text-foreground-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {context.cohortAccess.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Cohorts Yet
            </h3>
            <p className="text-foreground-muted max-w-sm mx-auto">
              You haven&apos;t been assigned to any cohorts yet. Contact your
              program administrator to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feature Flags Display (for debugging) */}
      {process.env.NODE_ENV === "development" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug: Feature Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono text-foreground-muted">
              {Object.entries(context.featureFlags).map(([key, value]) => (
                <div key={key}>
                  {key}: {String(value)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

