"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Link as LinkIcon,
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
  const [splitMessageMode, setSplitMessageMode] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi {{name}}, thanks for your interest in the {{role}} position. Book a call: {{calendly_link}}"
  );
  const [message1Template, setMessage1Template] = useState("Hi {{name}}, thanks for your interest in the {{role}} position.");
  const [message2Template, setMessage2Template] = useState("Book a call: {{calendly_link}}");
  const [message3Template, setMessage3Template] = useState("Let me know if you didn't see the link!");
  const [enableMessage3, setEnableMessage3] = useState(true);
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder2h, setReminder2h] = useState(true);
  const [sendingState, setSendingState] = useState<Record<string, "pending" | "sent" | "skipped">>({});
  const [currentMessageParts, setCurrentMessageParts] = useState<Record<string, number | null>>({});
  const [currentSendIndex, setCurrentSendIndex] = useState<number | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const selectedCandidatesList = useMemo(() => {
    return candidates.filter((c) => selectedCandidates.has(c.id));
  }, [candidates, selectedCandidates]);
  
  // Auto-advance detection: reload state when app comes to foreground (for split mode)
  useEffect(() => {
    if (!splitMessageMode || !campaignId) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // App came to foreground - could reload recipient states if needed
        // For now, state is managed locally
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [splitMessageMode, campaignId]);

  const characterCount = messageTemplate.length;
  const smsSegments = Math.ceil(characterCount / 160);
  
  const message1Count = message1Template.length;
  const message1Segments = Math.ceil(message1Count / 160);
  const message2Count = message2Template.length;
  const message2Segments = Math.ceil(message2Count / 160);
  const message3Count = message3Template.length;
  const message3Segments = Math.ceil(message3Count / 160);
  
  // Calculate Message 2 with interpolated URLs for validation
  const getMessage2Preview = (candidate: Candidate) => {
    const city = candidate.location.split(",")[0]?.trim() || candidate.location;
    return interpolateTemplate(message2Template, {
      name: candidate.name.split(" ")[0],
      city,
      role: candidate.jobTitle,
      calendly_link: calendlyUrl,
      zoom_link: zoomUrl || "N/A",
    });
  };

  const insertMergeTag = (tag: string) => {
    setMessageTemplate((prev) => prev + tag);
  };

  const getPreviewMessage = (candidate: Candidate) => {
    const city = candidate.location.split(",")[0]?.trim() || candidate.location;
    if (splitMessageMode) {
      // For split mode, show all parts
      const part1 = interpolateTemplate(message1Template, {
        name: candidate.name.split(" ")[0],
        city,
        role: candidate.jobTitle,
        calendly_link: calendlyUrl,
        zoom_link: zoomUrl || "N/A",
      });
      const part2 = getMessage2Preview(candidate);
      const part3 = enableMessage3 ? interpolateTemplate(message3Template, {
        name: candidate.name.split(" ")[0],
        city,
        role: candidate.jobTitle,
        calendly_link: calendlyUrl,
        zoom_link: zoomUrl || "N/A",
      }) : "";
      return [part1, part2, part3].filter(Boolean).join("\n\n---\n\n");
    }
    return interpolateTemplate(messageTemplate, {
      name: candidate.name.split(" ")[0],
      city,
      role: candidate.jobTitle,
      calendly_link: calendlyUrl,
      zoom_link: zoomUrl || "N/A",
    });
  };
  
  const getMessageForPart = (candidate: Candidate, part: 1 | 2 | 3): string => {
    const city = candidate.location.split(",")[0]?.trim() || candidate.location;
    const vars = {
      name: candidate.name.split(" ")[0],
      city,
      role: candidate.jobTitle,
      calendly_link: calendlyUrl,
      zoom_link: zoomUrl || "N/A",
    };
    
    if (part === 1) {
      return interpolateTemplate(message1Template, vars);
    } else if (part === 2) {
      return interpolateTemplate(message2Template, vars);
    } else {
      return interpolateTemplate(message3Template, vars);
    }
  };

  // Create or get campaign for Quick Send
  // Note: For Quick Send, campaigns are created on-demand via the sessions API
  // when starting Guided Send. For pure Quick Send (non-Guided), state is managed locally.
  // Full persistence requires creating CampaignRecipient records, which can be done
  // when the user explicitly saves the campaign or when transitioning to Guided Send.
  
  // Update currentMessagePart in database using sendBeacon or fetch with keepalive
  // Note: For Quick Send, state is primarily managed locally. When campaigns/recipients
  // are created (e.g., via Guided Send), this function can be used to persist state.
  const updateMessagePart = async (candidateId: string, part: number, recipientId?: string) => {
    if (!campaignId || !recipientId) {
      // State managed locally - persistence happens when campaign is created
      return;
    }
    
    const payload = JSON.stringify({
      action: "UPDATE_PART",
      currentMessagePart: part,
    });
    
    // Use sendBeacon for mobile reliability (works when app goes to background)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(
        `/api/campaigns/${campaignId}/recipients/${recipientId}`,
        blob
      );
    } else {
      // Fallback to fetch with keepalive
      await fetch(`/api/campaigns/${campaignId}/recipients/${recipientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Silently fail - state is managed locally
      });
    }
  };

  const handleQuickSend = async (candidate: Candidate, part?: 1 | 2 | 3) => {
    if (!splitMessageMode) {
      // Non-split mode: single message
      const message = getPreviewMessage(candidate);
      const smsUri = generateSmsUri(candidate.phone, message);
      window.open(smsUri, "_blank");
      setSendingState((prev) => ({ ...prev, [candidate.id]: "sent" }));
      return;
    }
    
    // Split mode: determine which part to send
    const currentPart = currentMessageParts[candidate.id] ?? null;
    let partToSend: 1 | 2 | 3;
    
    if (part !== undefined) {
      partToSend = part;
    } else if (currentPart === null || currentPart === 1) {
      partToSend = 1;
    } else if (currentPart === 2) {
      partToSend = 2;
    } else {
      partToSend = 3;
    }
    
    const message = getMessageForPart(candidate, partToSend);
    const smsUri = generateSmsUri(candidate.phone, message);
    window.open(smsUri, "_blank");
    
    // Update state
    const nextPart = partToSend === 1 ? 2 : (partToSend === 2 ? (enableMessage3 ? 3 : null) : null);
    setCurrentMessageParts((prev) => ({ ...prev, [candidate.id]: nextPart }));
    
    // Persist to database (will create campaign if needed)
    // Note: For full persistence, we'd need to create CampaignRecipient records
    // For now, state is managed locally and will be created when campaign is saved
    updateMessagePart(candidate.id, nextPart || partToSend).catch(() => {
      // Silently fail - state managed locally
    });
    
    // If this was the final part, mark as sent
    if (nextPart === null) {
      setSendingState((prev) => ({ ...prev, [candidate.id]: "sent" }));
      
      // Auto-advance to next candidate if Message 3 is disabled
      if (!enableMessage3 && partToSend === 2) {
        // Find next candidate
        const currentIndex = selectedCandidatesList.findIndex(c => c.id === candidate.id);
        if (currentIndex < selectedCandidatesList.length - 1) {
          const nextCandidate = selectedCandidatesList[currentIndex + 1];
          // Auto-scroll or highlight next candidate
          setTimeout(() => {
            document.getElementById(`candidate-${nextCandidate.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 500);
        }
      }
    }
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
          template: splitMessageMode ? message1Template : messageTemplate,
          variablesConfig,
          messagePolicy: "LOCKED",
          splitMessageMode,
          message1Template: splitMessageMode ? message1Template : undefined,
          message2Template: splitMessageMode ? message2Template : undefined,
          message3Template: splitMessageMode && enableMessage3 ? message3Template : undefined,
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
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={splitMessageMode}
                onChange={(e) => setSplitMessageMode(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-foreground">
                Split Links into Separate Messages
              </span>
            </label>
          </div>

          {!splitMessageMode ? (
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
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Message 1: Text only (no links) *
                </label>
                <Textarea
                  placeholder="Hi {{name}}, thanks for your interest..."
                  value={message1Template}
                  onChange={(e) => setMessage1Template(e.target.value)}
                  className="min-h-[80px] font-mono text-sm"
                />
                <div className="flex justify-between mt-1.5 text-xs text-foreground-muted">
                  <span>{message1Count} characters</span>
                  <span>~{message1Segments} SMS segment{message1Segments !== 1 ? "s" : ""}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Message 2: Link only (Calendly/Zoom) *
                </label>
                <Textarea
                  placeholder="Book a call: {{calendly_link}}"
                  value={message2Template}
                  onChange={(e) => setMessage2Template(e.target.value)}
                  className="min-h-[80px] font-mono text-sm"
                />
                <div className="flex justify-between mt-1.5 text-xs text-foreground-muted">
                  <span>{message2Count} characters</span>
                  <span>~{message2Segments} SMS segment{message2Segments !== 1 ? "s" : ""}</span>
                  {selectedCandidatesList.length > 0 && (
                    <span className="text-amber-500">
                      Preview: {getMessage2Preview(selectedCandidatesList[0]).length} chars with URLs
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableMessage3}
                    onChange={(e) => setEnableMessage3(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Message 3: Fallback text (Optional)
                  </span>
                </label>
                {enableMessage3 && (
                  <>
                    <Textarea
                      placeholder="Let me know if you didn't see the link..."
                      value={message3Template}
                      onChange={(e) => setMessage3Template(e.target.value)}
                      className="min-h-[80px] font-mono text-sm"
                    />
                    <div className="flex justify-between mt-1.5 text-xs text-foreground-muted">
                      <span>{message3Count} characters</span>
                      <span>~{message3Segments} SMS segment{message3Segments !== 1 ? "s" : ""}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

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
                    id={`candidate-${candidate.id}`}
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
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          {!splitMessageMode ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickSend(candidate)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          ) : (
                            <>
                              {(!currentMessageParts[candidate.id] || currentMessageParts[candidate.id] === 1) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickSend(candidate, 1)}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Send Message 1
                                </Button>
                              )}
                              {currentMessageParts[candidate.id] === 2 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickSend(candidate, 2)}
                                >
                                  <LinkIcon className="h-4 w-4 mr-1" />
                                  Send Link
                                </Button>
                              )}
                              {(currentMessageParts[candidate.id] === 3 || (currentMessageParts[candidate.id] === 2 && !enableMessage3)) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickSend(candidate, 3)}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  {enableMessage3 ? "Send Follow-up" : "Complete"}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
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
