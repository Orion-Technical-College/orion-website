"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, UserCheck, FileText, Activity, Database, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminStats } from "@/types/admin";
import { ROLES } from "@/lib/permissions";

interface StatsCardsProps {
  stats: AdminStats;
  onQuickAction?: (action: string) => void;
}

export function StatsCards({ stats, onQuickAction }: StatsCardsProps) {
  const roleLabels: Record<string, string> = {
    [ROLES.PLATFORM_ADMIN]: "Platform Admins",
    [ROLES.RECRUITER]: "Recruiters",
    [ROLES.CLIENT_ADMIN]: "Client Admins",
    [ROLES.CLIENT_USER]: "Client Users",
    [ROLES.CANDIDATE]: "Candidates",
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/20 text-green-400";
      case "degraded":
        return "bg-yellow-500/20 text-yellow-400";
      case "down":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Users */}
      <Card className="cursor-pointer hover:bg-background-tertiary transition-colors" onClick={() => onQuickAction?.("users")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-accent" />
          </div>
          <div className="mt-3 space-y-1">
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">{roleLabels[role] || role}:</span>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total Clients */}
      <Card className="cursor-pointer hover:bg-background-tertiary transition-colors" onClick={() => onQuickAction?.("clients")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Total Clients</p>
              <p className="text-2xl font-bold">{stats.totalClients}</p>
            </div>
            <Building2 className="h-8 w-8 text-accent" />
          </div>
          <div className="mt-3 flex gap-2">
            <Badge variant="outline" className={cn("text-xs", "bg-green-500/20 text-green-400")}>
              {stats.activeClients} Active
            </Badge>
            <Badge variant="outline" className={cn("text-xs", "bg-gray-500/20 text-gray-400")}>
              {stats.inactiveClients} Inactive
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Total Candidates */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Total Candidates</p>
              <p className="text-2xl font-bold">{stats.totalCandidates}</p>
            </div>
            <UserCheck className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Logs */}
      <Card className="cursor-pointer hover:bg-background-tertiary transition-colors" onClick={() => onQuickAction?.("audit-logs")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Recent Activity</p>
              <p className="text-2xl font-bold">{stats.recentAuditLogs}</p>
              <p className="text-xs text-foreground-muted mt-1">Last 24 hours</p>
            </div>
            <Activity className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>

      {/* System Health - Database */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Database</p>
              <Badge className={cn("mt-1", getHealthColor(stats.systemHealth.database))}>
                {stats.systemHealth.database}
              </Badge>
            </div>
            <Database className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>

      {/* System Health - Azure OpenAI */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Azure OpenAI</p>
              <Badge className={cn("mt-1", getHealthColor(stats.systemHealth.azureOpenAI))}>
                {stats.systemHealth.azureOpenAI}
              </Badge>
            </div>
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
