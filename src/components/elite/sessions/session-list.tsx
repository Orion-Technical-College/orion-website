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
  Calendar,
  Plus,
  Clock,
  Users,
  Video,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useEliteContext, useElitePermission } from "@/components/elite/layout";
import { ELITE_PERMISSIONS } from "@/lib/elite/permissions";
import { CreateSessionDialog } from "./create-session-dialog";

interface Session {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  timezone: string;
  duration: number;
  zoomUrl: string | null;
  status: string;
  host: {
    id: string;
    name: string;
    email: string;
  };
  cohort: {
    id: string;
    name: string;
  };
  _count: {
    attendance: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  IN_PROGRESS: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function SessionList() {
  const { context } = useEliteContext();
  const canManage = useElitePermission(ELITE_PERMISSIONS.MANAGE_SESSIONS);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const url =
        filter === "upcoming"
          ? "/api/elite/sessions?upcoming=true"
          : "/api/elite/sessions";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filter]);

  const handleSessionCreated = () => {
    setShowCreateDialog(false);
    fetchSessions();
  };

  const formatDateTime = (dateStr: string, timezone: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  if (!context) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
          <p className="text-foreground-muted">
            Schedule and manage training sessions
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-3 py-1.5 text-sm ${
                filter === "upcoming"
                  ? "bg-accent text-white"
                  : "bg-background text-foreground-muted hover:bg-background-tertiary"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-sm ${
                filter === "all"
                  ? "bg-accent text-white"
                  : "bg-background text-foreground-muted hover:bg-background-tertiary"
              }`}
            >
              All
            </button>
          </div>
          {canManage && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="py-4 flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={fetchSessions}>
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

      {/* Session list */}
      {!loading && !error && sessions.length > 0 && (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/elite/sessions/${session.id}`}
              className="block"
            >
              <Card className="hover:bg-background-tertiary transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">
                          {session.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            STATUS_COLORS[session.status] ??
                            STATUS_COLORS.SCHEDULED
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {session.cohort.name} • Hosted by {session.host.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDateTime(session.scheduledAt, session.timezone)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-foreground-muted">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(session.duration)}</span>
                          {session.zoomUrl && (
                            <>
                              <span className="mx-1">•</span>
                              <Video className="h-4 w-4" />
                              <span>Zoom</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-foreground-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && sessions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No {filter === "upcoming" ? "Upcoming " : ""}Sessions
            </h3>
            <p className="text-foreground-muted max-w-sm mx-auto mb-4">
              {canManage
                ? "Schedule a session to get started with your training program."
                : "No sessions have been scheduled for your cohorts yet."}
            </p>
            {canManage && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Session Dialog */}
      {showCreateDialog && (
        <CreateSessionDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleSessionCreated}
        />
      )}
    </div>
  );
}
