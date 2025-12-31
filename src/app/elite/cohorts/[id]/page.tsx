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
  Users,
  Calendar,
  Settings,
  Loader2,
  AlertCircle,
  UserPlus,
  Upload,
} from "lucide-react";
import { useElitePermission } from "@/components/elite/layout";
import { ELITE_PERMISSIONS } from "@/lib/elite/permissions";

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

interface Member {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ARCHIVED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const ROLE_COLORS: Record<string, string> = {
  LEARNER: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  COACH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  INSTRUCTOR: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
};

export default function CohortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const canManageRoster = useElitePermission(ELITE_PERMISSIONS.MANAGE_ROSTER);

  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchCohort = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cohortRes, membersRes] = await Promise.all([
        fetch(`/api/elite/cohorts/${id}`),
        fetch(`/api/elite/cohorts/${id}/members`),
      ]);

      if (!cohortRes.ok) {
        throw new Error("Cohort not found");
      }

      const cohortData = await cohortRes.json();
      setCohort(cohortData);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohort();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {error || "Cohort not found"}
            </h2>
            <Link href="/elite/cohorts">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cohorts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const learners = members.filter((m) => m.role === "LEARNER" && m.status === "ACTIVE");
  const coaches = members.filter((m) => m.role === "COACH" && m.status === "ACTIVE");
  const instructors = members.filter((m) => m.role === "INSTRUCTOR" && m.status === "ACTIVE");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/elite/cohorts"
            className="inline-flex items-center text-sm text-foreground-muted hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cohorts
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{cohort.name}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                STATUS_COLORS[cohort.status] ?? STATUS_COLORS.DRAFT
              }`}
            >
              {cohort.status}
            </span>
          </div>
          <p className="text-foreground-muted mt-1">
            {cohort.programTemplate.name}
            {cohort.orgUnit && ` • ${cohort.orgUnit.name}`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roster">
            Roster ({members.filter((m) => m.status === "ACTIVE").length})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            Sessions ({cohort._count.sessions})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted">
                  Learners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {learners.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted">
                  Coaches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {coaches.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground-muted">
                  Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {cohort._count.sessions}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cohort Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-foreground-muted">Program Template</p>
                  <p className="font-medium text-foreground">
                    {cohort.programTemplate.name}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-muted">Timezone</p>
                  <p className="font-medium text-foreground">{cohort.timezone}</p>
                </div>
                {cohort.startDate && (
                  <div>
                    <p className="text-foreground-muted">Start Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(cohort.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {cohort.endDate && (
                  <div>
                    <p className="text-foreground-muted">End Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(cohort.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roster Tab */}
        <TabsContent value="roster" className="space-y-4">
          {canManageRoster && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button size="sm" disabled>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          )}

          {/* Instructors */}
          {instructors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Instructors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {instructors.map((member) => (
                    <MemberRow key={member.id} member={member} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Coaches */}
          {coaches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Coaches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coaches.map((member) => (
                    <MemberRow key={member.id} member={member} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learners */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Learners ({learners.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {learners.length === 0 ? (
                <p className="text-sm text-foreground-muted py-4 text-center">
                  No learners in this cohort yet
                </p>
              ) : (
                <div className="space-y-2">
                  {learners.map((member) => (
                    <MemberRow key={member.id} member={member} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Sessions Coming Soon
              </h3>
              <p className="text-foreground-muted max-w-sm mx-auto">
                Session scheduling will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-background-tertiary">
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
          <p className="text-xs text-foreground-muted">{member.user.email}</p>
        </div>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          ROLE_COLORS[member.role] ?? ROLE_COLORS.LEARNER
        }`}
      >
        {member.role}
      </span>
    </div>
  );
}

