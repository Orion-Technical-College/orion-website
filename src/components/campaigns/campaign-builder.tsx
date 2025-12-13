"use client";

import React, { useState, useMemo } from "react";
import { cn, interpolateTemplate, generateSmsUri } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import type { Candidate } from "@/types";

interface CampaignBuilderProps {
  candidates: Candidate[];
  selectedCandidates: Set<string>;
  onToggleCandidate: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStartGuidedSend?: (sessionId: string) => void; // Callback when session is created
}

const MERGE_TAGS = [
  { tag: "{{name}}", label: "Name", color: "bg-blue-500" },
  { tag: "{{city}}", label: "City", color: "bg-green-500" },
  { tag: "{{role}}", label: "Role", color: "bg-purple-500" },
  { tag: "{{calendly_link}}", label: "Calendly", color: "bg-orange-500" },
  { tag: "{{zoom_link}}", label: "Zoom", color: "bg-cyan-500" },
];

function CampaignBuilderComponent({
  candidates,
  selectedCandidates,
  onToggleCandidate,
  onSelectAll,
  onDeselectAll,
  onStartGuidedSend,
}: CampaignBuilderProps) {
  const [campaignName, setCampaignName] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState("https://calendly.com/your-link");
  const [zoomUrl, setZoomUrl] = useState("");
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi {{name}}, thanks for your interest in the {{role}} position. Book a call: {{calendly_link}}"
  );
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder2h, setReminder2h] = useState(true);
  const [sendingState, setSendingState] = useState<Record<string, "pending" | "sent" | "skipped">>({});
  const [currentSendIndex, setCurrentSendIndex] = useState<number | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const selectedCandidatesList = useMemo(() => {
    return candidates.filter((c) => selectedCandidates.has(c.id));
  }, [candidates, selectedCandidates]);

  const characterCount = messageTemplate.length;
  const smsSegments = Math.ceil(characterCount / 160);

  const insertMergeTag = (tag: string) => {
    setMessageTemplate((prev) => prev + tag);
  };

  const getPreviewMessage = (candidate: Candidate) => {
    const city = candidate.location.split(",")[0]?.trim() || candidate.location;
    return interpolateTemplate(messageTemplate, {
      name: candidate.name.split(" ")[0],
      city,
      role: candidate.jobTitle,
      calendly_link: calendlyUrl,
      zoom_link: zoomUrl || "N/A",
    });
  };

  const handleQuickSend = (candidate: Candidate) => {
    const message = getPreviewMessage(candidate);
    const smsUri = generateSmsUri(candidate.phone, message);
    window.open(smsUri, "_blank");
    setSendingState((prev) => ({ ...prev, [candidate.id]: "sent" }));
  };

  const handleStartGuidedSend = async () => {
    if (selectedCandidates.size === 0) {
      return;
    }

    try {
      setIsCreatingSession(true);

      // First, create or get campaign
      // For now, we'll create a campaign if campaignName is provided
      // In a full implementation, you'd have a campaign management system
      let campaignId = "";
      
      if (campaignName) {
        // Create campaign via API (if endpoint exists)
        // For now, we'll use a placeholder - in production, create campaign first
        // This is a simplified version - you may want to create campaigns separately
        campaignId = `temp-${Date.now()}`;
      }

      const candidateIds = Array.from(selectedCandidates);

      // Build variables config from campaign settings
      const variablesConfig: Record<string, string> = {};
      if (calendlyUrl) variablesConfig.calendly_link = calendlyUrl;
      if (zoomUrl) variablesConfig.zoom_link = zoomUrl;

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `campaign-${Date.now()}-${candidateIds.join("-")}`,
        },
        body: JSON.stringify({
          campaignId: campaignId || "default", // Use default if no campaign name
          candidateIds,
          template: messageTemplate,
          variablesConfig,
          messagePolicy: "LOCKED",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create session");
      }

      const data = await response.json();
      setSessionId(data.sessionId);

      // Trigger navigation to guided send (handled by parent)
      if (onStartGuidedSend) {
        onStartGuidedSend(data.sessionId);
      }
    } catch (error: any) {
      console.error("[CAMPAIGN_BUILDER] Failed to start guided send:", error);
      alert(error.message || "Failed to start guided send session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const sentCount = Object.values(sendingState).filter((s) => s === "sent").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Campaign Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            Create Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Campaign Name
            </label>
            <Input
              placeholder="e.g., Indeed Q1 2024"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Calendly URL
            </label>
            <Input
              placeholder="https://calendly.com/your-link"
              value={calendlyUrl}
              onChange={(e) => setCalendlyUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Zoom URL (Optional)
            </label>
            <Input
              placeholder="https://zoom.us/j/your-meeting-id"
              value={zoomUrl}
              onChange={(e) => setZoomUrl(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">
                Message Template
              </label>
              <div className="flex gap-1">
                {MERGE_TAGS.map((tag) => (
                  <button
                    key={tag.tag}
                    onClick={() => insertMergeTag(tag.tag)}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded text-white transition-opacity hover:opacity-80",
                      tag.color
                    )}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Enter your message template..."
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
            <div className="flex justify-between mt-1.5 text-xs text-foreground-muted">
              <span>{characterCount} characters</span>
              <span>~{smsSegments} SMS message{smsSegments !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Reminder Timing (hours before appointment)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminder24h}
                  onChange={(e) => setReminder24h(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm">24h</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminder2h}
                  onChange={(e) => setReminder2h(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm">2h</span>
              </label>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleStartGuidedSend}
            disabled={selectedCandidates.size === 0 || isCreatingSession}
          >
            <Send className="h-4 w-4 mr-2" />
            {isCreatingSession
              ? "Starting..."
              : `Start Guided Send (${selectedCandidates.size} candidate${selectedCandidates.size !== 1 ? "s" : ""})`}
          </Button>
        </CardContent>
      </Card>

      {/* Candidate Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select Candidates ({selectedCandidates.size} selected)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={onDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {candidates.map((candidate) => {
                const isSelected = selectedCandidates.has(candidate.id);
                const status = sendingState[candidate.id];
                const previewMessage = getPreviewMessage(candidate);

                return (
                  <div
                    key={candidate.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      isSelected
                        ? "border-accent bg-accent-muted"
                        : "border-border hover:border-border-hover",
                      status === "sent" && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleCandidate(candidate.id)}
                        className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {candidate.name}
                          </span>
                          {status === "sent" && (
                            <CheckCircle2 className="h-4 w-4 text-status-hired" />
                          )}
                          {status === "skipped" && (
                            <XCircle className="h-4 w-4 text-status-denied" />
                          )}
                          {!status && isSelected && (
                            <Clock className="h-4 w-4 text-foreground-muted" />
                          )}
                        </div>
                        <p className="text-sm text-foreground-muted">
                          {candidate.phone} • {candidate.jobTitle}
                        </p>
                        {isSelected && (
                          <div className="mt-2 p-2 bg-background rounded text-xs text-foreground-muted">
                            <p className="font-medium text-foreground mb-1">Preview:</p>
                            {previewMessage}
                          </div>
                        )}
                      </div>
                      {isSelected && status !== "sent" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickSend(candidate)}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const CampaignBuilder = React.memo(CampaignBuilderComponent);
CampaignBuilder.displayName = "CampaignBuilder";
