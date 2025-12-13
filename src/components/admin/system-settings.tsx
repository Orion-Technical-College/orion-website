"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Sparkles, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";
import type { SystemFeatureFlag } from "@/types/admin";

interface SystemSettingsProps {
  config: {
    featureFlags: SystemFeatureFlag[];
    azureOpenAI: {
      deploymentName: string;
      status: string;
      hasEndpoint: boolean;
      hasKey: boolean;
    };
    aiAssistant: {
      enabled: boolean;
    };
    environment: string;
  };
  health: {
    overall: string;
    database: { status: string; latency: number };
    azureOpenAI: { status: string; hasEndpoint: boolean; hasKey: boolean; hasDeployment: boolean };
  };
}

export function SystemSettings({ config, health }: SystemSettingsProps) {
  const [featureFlags, setFeatureFlags] = useState(config.featureFlags);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [flagToToggle, setFlagToToggle] = useState<SystemFeatureFlag | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/20 text-green-400 border-green-500/20";
      case "degraded":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/20";
      case "down":
        return "bg-red-500/20 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/20";
    }
  };

  const handleToggleFlag = async (flag: SystemFeatureFlag) => {
    if (flag.isEnabled) {
      // Disabling - show confirmation
      setFlagToToggle(flag);
      setToggleConfirmOpen(true);
    } else {
      // Enabling - no confirmation needed
      await performToggle(flag);
    }
  };

  const performToggle = async (flag: SystemFeatureFlag) => {
    try {
      setIsToggling(flag.key);
      setError(null);

      const response = await fetch(`/api/admin/system/feature-flags/${flag.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !flag.isEnabled }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to toggle feature flag");
      }

      // Update local state
      setFeatureFlags((prev) =>
        prev.map((f) => (f.key === flag.key ? { ...f, isEnabled: !f.isEnabled } : f))
      );

      setSuccessMessage(`Feature flag ${flag.key} ${!flag.isEnabled ? "enabled" : "disabled"}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to toggle feature flag");
    } finally {
      setIsToggling(null);
      setFlagToToggle(null);
    }
  };

  const handleConfirmToggle = async () => {
    if (flagToToggle) {
      await performToggle(flagToToggle);
    }
    setToggleConfirmOpen(false);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Feature Flags
            </CardTitle>
            <CardDescription>Enable or disable features dynamically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featureFlags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{flag.key}</span>
                    <Badge variant={flag.isEnabled ? "default" : "outline"}>
                      {flag.isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground-muted mt-1">{flag.description}</p>
                  <p className="text-xs text-foreground-muted mt-1">
                    Last updated: {new Date(flag.lastUpdated).toLocaleString()} by {flag.updatedByName || "Unknown"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleFlag(flag)}
                  disabled={isToggling === flag.key}
                >
                  {isToggling === flag.key
                    ? "Updating..."
                    : flag.isEnabled
                    ? "Disable"
                    : "Enable"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Azure OpenAI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Azure OpenAI Configuration
            </CardTitle>
            <CardDescription>AI service configuration status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div className="font-medium">Deployment Name</div>
                <p className="text-sm text-foreground-muted font-mono">{config.azureOpenAI.deploymentName}</p>
              </div>
              <Badge className={cn(getHealthColor(config.azureOpenAI.status))}>
                {config.azureOpenAI.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-2">
                {config.azureOpenAI.hasEndpoint ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span>Endpoint</span>
              </div>
              <div className="flex items-center gap-2">
                {config.azureOpenAI.hasKey ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span>API Key</span>
              </div>
            </div>
            <p className="text-xs text-foreground-muted">
              Configure via environment variables. See{" "}
              <a
                href="/docs"
                className="text-accent hover:underline inline-flex items-center gap-1"
              >
                documentation
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>System status and environment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-foreground-muted">Environment</div>
                <Badge variant="outline" className="mt-1">
                  {config.environment}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-foreground-muted">Database Status</div>
                <Badge className={cn("mt-1", getHealthColor(health.database.status))}>
                  {health.database.status}
                  {health.database.latency > 0 && ` (${health.database.latency}ms)`}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-sm text-foreground-muted">Overall Health</div>
              <Badge className={cn("mt-1", getHealthColor(health.overall))}>
                {health.overall}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        )}
      </div>

      {/* Toggle Confirmation */}
      <ConfirmDialog
        open={toggleConfirmOpen}
        onOpenChange={setToggleConfirmOpen}
        onConfirm={handleConfirmToggle}
        title="Disable Feature Flag"
        description={`Are you sure you want to disable ${flagToToggle?.key}? This may affect system functionality.`}
        severity="warning"
        confirmLabel="Disable"
        isLoading={isToggling === flagToToggle?.key}
      />
    </>
  );
}
