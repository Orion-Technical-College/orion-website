"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "./user-management";
import { ClientManagement } from "./client-management";
import { AuditLogViewer } from "./audit-log-viewer";
import { SystemSettings } from "./system-settings";
import { StatsCards } from "./stats-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Building2, FileText, Settings } from "lucide-react";
import type { AdminStats, SystemFeatureFlag } from "@/types/admin";

interface RecentActivity {
  id: string;
  createdAt: string;
  actorName: string;
  action: string;
  targetType: string | null;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsResponse = await fetch("/api/admin/stats");
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }

        // Fetch system config
        const configResponse = await fetch("/api/admin/system/config");
        const configData = await configResponse.json();
        if (configData.success) {
          setSystemConfig(configData.data);
        }

        // Fetch system health
        const healthResponse = await fetch("/api/admin/system/health");
        const healthData = await healthResponse.json();
        if (healthData.success) {
          setSystemHealth(healthData.data);
        }

        // Fetch recent activity (last 10 audit logs)
        const activityResponse = await fetch("/api/admin/audit-logs?limit=10&sortBy=createdAt&sortDir=desc");
        const activityData = await activityResponse.json();
        if (activityData.success) {
          setRecentActivity(activityData.data.slice(0, 10));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "users":
        setActiveTab("users");
        break;
      case "clients":
        setActiveTab("clients");
        break;
      case "audit-logs":
        setActiveTab("audit-logs");
        break;
    }
  };

  if (loading && !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-foreground-muted">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Platform Administration</h1>
        <p className="text-foreground-muted">
          Manage users, clients, and system settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {stats && <StatsCards stats={stats} onQuickAction={handleQuickAction} />}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Last 10 system actions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-foreground-muted">No recent activity</div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-background-tertiary transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{activity.actorName}</span>
                          <span className="text-sm text-foreground-muted">{activity.action}</span>
                          {activity.targetType && (
                            <Badge variant="outline" className="text-xs">
                              {activity.targetType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-foreground-muted mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="clients">
          <ClientManagement />
        </TabsContent>

        <TabsContent value="audit-logs">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="settings">
          {systemConfig && systemHealth && (
            <SystemSettings config={systemConfig} health={systemHealth} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
