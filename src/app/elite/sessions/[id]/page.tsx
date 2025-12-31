"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  Users,
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useElitePermission } from "@/components/elite/layout";
import { ELITE_PERMISSIONS } from "@/lib/elite/permissions";

interface Session {
  id: string;
  title: string;
  description: string | null;
  agenda: string | null;
  scheduledAt: string;
  timezone: string;
  duration: number;
  zoomUrl: string | null;
  calendarEventId: string | null;
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

interface AttendanceRecord {
  id: string;
  status: string;
  auditNote: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Member {
  id: string;
  role: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  IN_PROGRESS: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const ATTENDANCE_ICONS: Record<string, React.ElementType> = {
  PRESENT: CheckCircle,
  ABSENT: XCircle,
  EXCUSED: MinusCircle,
};

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: "text-green-600 dark:text-green-400",
  ABSENT: "text-red-600 dark:text-red-400",
  EXCUSED: "text-yellow-600 dark:text-yellow-400",
};

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const canRecordAttendance = useElitePermission(ELITE_PERMISSIONS.RECORD_ATTENDANCE);

  const [session, setSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [savingAttendance, setSavingAttendance] = useState(false);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionRes, attendanceRes] = await Promise.all([
        fetch(`/api/elite/sessions/${id}`),
        fetch(`/api/elite/sessions/${id}/attendance`),
      ]);

      if (!sessionRes.ok) {
        throw new Error("Session not found");
      }

      const sessionData = await sessionRes.json();
      setSession(sessionData);

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendance(attendanceData);
      }

      // Fetch cohort members for attendance tracking
      if (sessionData.cohort?.id) {
        const membersRes = await fetch(
          `/api/elite/cohorts/${sessionData.cohort.id}/members`
        );
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(
            membersData.filter(
              (m: Member) => m.role === "LEARNER" && m.status === "ACTIVE"
            )
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [id]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${hours} hour${hours > 1 ? "s" : ""} ${mins} minutes`;
  };

  const getAttendanceStatus = (userId: string) => {
    const record = attendance.find((a) => a.user.id === userId);
    return record?.status;
  };

  const handleAttendanceChange = async (
    userId: string,
    status: "PRESENT" | "ABSENT" | "EXCUSED"
  ) => {
    try {
      setSavingAttendance(true);
      const res = await fetch(`/api/elite/sessions/${id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });

      if (!res.ok) {
        throw new Error("Failed to record attendance");
      }

      // Refresh attendance
      const attendanceRes = await fetch(`/api/elite/sessions/${id}/attendance`);
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendance(attendanceData);
      }
    } catch (err) {
      console.error("Error recording attendance:", err);
    } finally {
      setSavingAttendance(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {error || "Session not found"}
            </h2>
            <Link href="/elite/sessions">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sessions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const excusedCount = attendance.filter((a) => a.status === "EXCUSED").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/elite/sessions"
            className="inline-flex items-center text-sm text-foreground-muted hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sessions
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{session.title}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                STATUS_COLORS[session.status] ?? STATUS_COLORS.SCHEDULED
              }`}
            >
              {session.status}
            </span>
          </div>
          <p className="text-foreground-muted mt-1">
            {session.cohort.name} • Hosted by {session.host.name}
          </p>
        </div>

        {session.zoomUrl && (
          <a
            href={session.zoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button>
              <Video className="h-4 w-4 mr-2" />
              Join Zoom
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </a>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="attendance">
            Attendance ({presentCount}/{members.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-foreground">
                  {formatDateTime(session.scheduledAt)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-foreground">
                  {formatDuration(session.duration)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-foreground">
                  {presentCount} present, {absentCount} absent, {excusedCount} excused
                </p>
              </CardContent>
            </Card>
          </div>

          {session.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted whitespace-pre-wrap">
                  {session.description}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Tracker</CardTitle>
              <CardDescription>
                Record attendance for learners in this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-foreground-muted py-4 text-center">
                  No learners in this cohort
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const status = getAttendanceStatus(member.user.id);
                    const Icon = status ? ATTENDANCE_ICONS[status] : null;

                    return (
                      <div
                        key={member.user.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-background-tertiary"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center">
                            <span className="text-sm font-medium text-foreground-muted">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {member.user.name}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              {member.user.email}
                            </p>
                          </div>
                        </div>

                        {canRecordAttendance ? (
                          <div className="flex gap-1">
                            <Button
                              variant={status === "PRESENT" ? "default" : "ghost"}
                              size="sm"
                              onClick={() =>
                                handleAttendanceChange(member.user.id, "PRESENT")
                              }
                              disabled={savingAttendance}
                              className={
                                status === "PRESENT"
                                  ? "bg-green-600 hover:bg-green-700"
                                  : ""
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={status === "ABSENT" ? "default" : "ghost"}
                              size="sm"
                              onClick={() =>
                                handleAttendanceChange(member.user.id, "ABSENT")
                              }
                              disabled={savingAttendance}
                              className={
                                status === "ABSENT"
                                  ? "bg-red-600 hover:bg-red-700"
                                  : ""
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={status === "EXCUSED" ? "default" : "ghost"}
                              size="sm"
                              onClick={() =>
                                handleAttendanceChange(member.user.id, "EXCUSED")
                              }
                              disabled={savingAttendance}
                              className={
                                status === "EXCUSED"
                                  ? "bg-yellow-600 hover:bg-yellow-700"
                                  : ""
                              }
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon
                                className={`h-5 w-5 ${
                                  ATTENDANCE_COLORS[status!] ?? ""
                                }`}
                              />
                            )}
                            <span className="text-sm text-foreground-muted">
                              {status ?? "Not recorded"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

