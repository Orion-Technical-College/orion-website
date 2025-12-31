"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Share2,
  AlertCircle,
  ArrowLeft,
  Link as LinkIcon,
} from "lucide-react";
import { cn, interpolateTemplate } from "@/lib/utils";
import { openComposeAndroid, openComposeWebShare } from "@/lib/sms-compose";
import { saveSession, loadSession, clearSession } from "@/lib/session-storage";
import { ReturnPrompt, useReturnDetection } from "./return-prompt";
import type { Candidate } from "@/types";

interface GuidedSendRecipient {
  id: string;
  candidateId: string;
  candidate?: {
    id: string;
    name: string;
    phone: string;
    jobTitle: string | null;
    location: string | null;
  };
  order: number;
  phoneRaw?: string | null;
  phoneE164?: string | null;
  renderedMessage: string;
  renderedFromTemplateVersion: number;
  currentMessagePart?: number | null;
  status: "PENDING" | "OPENED" | "SENT" | "SKIPPED" | "BLOCKED" | "CANCELLED" | "FAILED";
  openedAt?: string | null;
  openCount: number;
  lastOpenedAt?: string | null;
  sentAt?: string | null;
  skippedReason?: string | null;
  blockedReason?: "OPTED_OUT" | "CONSENT_UNKNOWN" | "INVALID_PHONE" | null;
}

interface GuidedSendSession {
  id: string;
  campaignId: string;
  clientId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  currentIndex: number;
  lastActiveRecipientId?: string | null;
  nextRecipientId?: string | null;
  campaign?: {
    id: string;
    splitMessageMode: boolean;
    message1Template?: string | null;
    message2Template?: string | null;
    message3Template?: string | null;
    calendlyUrl?: string | null;
    zoomUrl?: string | null;
  };
  variablesSnapshot?: string | null;
  counts: {
    total: number;
    actionableTotal: number;
    sent: number;
    skipped: number;
    blocked: number;
    cancelled: number;
    failed: number;
    remaining: number;
  };
  recipients: GuidedSendRecipient[];
}

interface GuidedSendProps {
  sessionId: string;
  campaignName: string;
  onBack?: () => void;
  onComplete?: () => void;
}

/**
 * Guided Send Component
 * Sequential one-at-a-time SMS sending workflow
 */
export function GuidedSend({
  sessionId,
  campaignName,
  onBack,
  onComplete,
}: GuidedSendProps) {
  const [session, setSession] = useState<GuidedSendSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null); // recipientId being updated
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [returnPromptRecipientId, setReturnPromptRecipientId] = useState<string | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Parse split message config from session
  const splitMessageConfig = useMemo(() => {
    if (!session?.campaign?.splitMessageMode) return null;
    
    try {
      // Try to get from campaign first, then fallback to variablesSnapshot
      let message1 = session.campaign.message1Template;
      let message2 = session.campaign.message2Template;
      let message3 = session.campaign.message3Template;
      
      if (!message1 || !message2) {
        // Fallback to variablesSnapshot
        if (session.variablesSnapshot) {
          const vars = JSON.parse(session.variablesSnapshot);
          message1 = message1 || vars.message1Template;
          message2 = message2 || vars.message2Template;
          message3 = message3 || vars.message3Template;
        }
      }
      
      return {
        message1Template: message1 || "",
        message2Template: message2 || "",
        message3Template: message3 || "",
        hasMessage3: message3 && message3.trim().length > 0,
        calendlyUrl: session.campaign.calendlyUrl || "",
        zoomUrl: session.campaign.zoomUrl || "",
      };
    } catch (err) {
      console.error("[GUIDED_SEND] Failed to parse split message config:", err);
      return null;
    }
  }, [session]);
  
  const returnDetection = useReturnDetection((lastOpenedRecipientId) => {
    if (lastOpenedRecipientId) {
      setReturnPromptRecipientId(lastOpenedRecipientId);
      setShowReturnPrompt(true);
    }
  });

  // Load session state from server (source of truth)
  const loadSessionState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to load session");
      }

      const data = await response.json();
      setSession(data);

      // Restore UI context from IndexedDB
      const uiState = await loadSession(sessionId);
      if (uiState?.scrollPosition) {
        // Restore scroll position if needed
        window.scrollTo(0, uiState.scrollPosition);
      }
    } catch (err: any) {
      console.error("[GUIDED_SEND] Failed to load session:", err);
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSessionState();
  }, [loadSessionState]);

  // Auto-advance detection: reload session when app comes to foreground
  useEffect(() => {
    if (!splitMessageConfig) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // App came to foreground - reload session state
        loadSessionState();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [splitMessageConfig, loadSessionState]);

  // Get message for specific part (for split mode)
  const getMessageForPart = useCallback((recipient: GuidedSendRecipient, part: 1 | 2 | 3): string => {
    if (!splitMessageConfig) return recipient.renderedMessage;
    
    const candidate = recipient.candidate;
    if (!candidate) return recipient.renderedMessage;
    
    const city = candidate.location?.split(",")[0]?.trim() || candidate.location || "";
    const vars = {
      name: candidate.name.split(" ")[0],
      city,
      role: candidate.jobTitle || "",
      calendly_link: splitMessageConfig.calendlyUrl || "",
      zoom_link: splitMessageConfig.zoomUrl || "N/A",
    };
    
    if (part === 1) {
      return interpolateTemplate(splitMessageConfig.message1Template, vars);
    } else if (part === 2) {
      return interpolateTemplate(splitMessageConfig.message2Template, vars);
    } else {
      return interpolateTemplate(splitMessageConfig.message3Template, vars);
    }
  }, [splitMessageConfig]);

  // Handle opening SMS compose
  const handleOpenSMS = useCallback(
    async (recipient: GuidedSendRecipient, part?: 1 | 2 | 3) => {
      if (!recipient.phoneE164) {
        setToastMessage("Cannot send: phone number is invalid");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      // Determine which message to send
      const isSplitMode = splitMessageConfig !== null;
      const currentPart = recipient.currentMessagePart ?? null;
      let partToSend: 1 | 2 | 3;
      let message: string;
      
      if (part !== undefined) {
        partToSend = part;
        message = getMessageForPart(recipient, part);
      } else if (isSplitMode) {
        // Determine part based on currentMessagePart
        if (currentPart === null || currentPart === 1) {
          partToSend = 1;
        } else if (currentPart === 2) {
          partToSend = 2;
        } else {
          partToSend = 3;
        }
        message = getMessageForPart(recipient, partToSend);
      } else {
        message = recipient.renderedMessage;
        partToSend = 1; // Not used in non-split mode
      }

      // Set awaiting return state
      returnDetection.setAwaitingReturn(true);
      returnDetection.setLastOpenedRecipientId(recipient.id);

      // Copy to clipboard and open SMS
      const result = await openComposeAndroid(recipient.phoneE164, message);

      if (result.method === "SMS_URI") {
        setToastMessage("Copied. Paste in Messages if not prefilled.");
        setTimeout(() => setToastMessage(null), 3000);
      }

      // Update recipient status to OPENED with currentMessagePart
      try {
        setUpdating(recipient.id);
        
        // Use sendBeacon or fetch with keepalive for mobile reliability
        const payload = JSON.stringify({ 
          action: "OPEN",
          currentMessagePart: isSplitMode ? partToSend : undefined,
        });
        
        let response: Response;
        if (navigator.sendBeacon && isSplitMode) {
          // Use sendBeacon for split mode (more reliable on mobile)
          const blob = new Blob([payload], { type: "application/json" });
          const sent = navigator.sendBeacon(
            `/api/sessions/${sessionId}/recipients/${recipient.id}`,
            blob
          );
          if (sent) {
            // Reload session state after a short delay
            setTimeout(() => loadSessionState(), 500);
            return;
          }
        }
        
        // Fallback to fetch with keepalive
        response = await fetch(
          `/api/sessions/${sessionId}/recipients/${recipient.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update recipient status");
        }

        const data = await response.json();
        setSession(data.session);
      } catch (err: any) {
        console.error("[GUIDED_SEND] Failed to update recipient:", err);
        setToastMessage("Failed to update status");
        setTimeout(() => setToastMessage(null), 3000);
      } finally {
        setUpdating(null);
      }
    },
    [sessionId, returnDetection, splitMessageConfig, getMessageForPart, loadSessionState]
  );

  // Handle marking as sent
  const handleMarkSent = useCallback(
    async (recipientId: string, part?: 1 | 2 | 3) => {
      try {
        setUpdating(recipientId);
        
        const recipient = session?.recipients.find(r => r.id === recipientId);
        if (!recipient) return;
        
        const isSplitMode = splitMessageConfig !== null;
        const currentPart = recipient.currentMessagePart ?? null;
        
        // Determine next part or completion
        let nextPart: number | undefined;
        if (isSplitMode && part !== undefined) {
          // Explicit part provided
          if (part === 1) {
            nextPart = 2;
          } else if (part === 2) {
            nextPart = splitMessageConfig.hasMessage3 ? 3 : undefined; // undefined means complete
          } else {
            nextPart = undefined; // Complete
          }
        } else if (isSplitMode) {
          // Infer from current part
          if (currentPart === null || currentPart === 1) {
            nextPart = 2;
          } else if (currentPart === 2) {
            nextPart = splitMessageConfig.hasMessage3 ? 3 : undefined;
          } else {
            nextPart = undefined; // Complete
          }
        }
        
        const payload = JSON.stringify({ 
          action: "MARK_SENT",
          currentMessagePart: nextPart,
        });
        
        // Use sendBeacon or fetch with keepalive
        let response: Response;
        if (navigator.sendBeacon && isSplitMode) {
          const blob = new Blob([payload], { type: "application/json" });
          const sent = navigator.sendBeacon(
            `/api/sessions/${sessionId}/recipients/${recipientId}`,
            blob
          );
          if (sent) {
            setTimeout(() => loadSessionState(), 500);
            return;
          }
        }
        
        response = await fetch(
          `/api/sessions/${sessionId}/recipients/${recipientId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to mark as sent");
        }

        const data = await response.json();
        setSession(data.session);

        // Save UI state
        await saveSession(sessionId, {
          lastViewedRecipientId: recipientId,
        });

        // Auto-advance if Message 3 is disabled and we just sent Message 2
        if (isSplitMode && !splitMessageConfig.hasMessage3 && currentPart === 2) {
          // Auto-advance to next candidate
          setTimeout(() => loadSessionState(), 1000);
        }

        // Check if session is complete
        if (data.session.status === "COMPLETED") {
          setToastMessage("Session completed!");
          setTimeout(() => {
            setToastMessage(null);
            onComplete?.();
          }, 2000);
        }
      } catch (err: any) {
        console.error("[GUIDED_SEND] Failed to mark as sent:", err);
        setToastMessage("Failed to update status");
        setTimeout(() => setToastMessage(null), 3000);
      } finally {
        setUpdating(null);
      }
    },
    [sessionId, onComplete, session, splitMessageConfig, loadSessionState]
  );
  
  // Handle sending Message 2 (Link)
  const handleSendMessage2 = useCallback(
    async (recipient: GuidedSendRecipient) => {
      await handleOpenSMS(recipient, 2);
    },
    [handleOpenSMS]
  );
  
  // Handle sending Message 3 (Follow-up)
  const handleSendMessage3 = useCallback(
    async (recipient: GuidedSendRecipient) => {
      await handleOpenSMS(recipient, 3);
    },
    [handleOpenSMS]
  );

  // Handle skip
  const handleSkip = useCallback(
    async (recipientId: string) => {
      try {
        setUpdating(recipientId);
        const response = await fetch(
          `/api/sessions/${sessionId}/recipients/${recipientId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "SKIP", skippedReason: "User skipped" }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to skip");
        }

        const data = await response.json();
        setSession(data.session);
      } catch (err: any) {
        console.error("[GUIDED_SEND] Failed to skip:", err);
        setToastMessage("Failed to skip");
        setTimeout(() => setToastMessage(null), 3000);
      } finally {
        setUpdating(null);
      }
    },
    [sessionId]
  );

  // Handle return prompt confirmation
  const handleReturnConfirm = useCallback(
    async (sent: boolean) => {
      if (!returnPromptRecipientId) return;

      setShowReturnPrompt(false);

      if (sent) {
        await handleMarkSent(returnPromptRecipientId);
      } else {
        // User said no - leave as OPENED or allow skip
        // For now, just leave it OPENED
      }

      returnDetection.setLastOpenedRecipientId(undefined);
    },
    [returnPromptRecipientId, handleMarkSent, returnDetection]
  );

  // Handle copy message
  const handleCopy = useCallback(async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setToastMessage("Copied to clipboard");
      setTimeout(() => setToastMessage(null), 2000);
    } catch (err) {
      setToastMessage("Failed to copy");
      setTimeout(() => setToastMessage(null), 2000);
    }
  }, []);

  // Handle share (Web Share API)
  const handleShare = useCallback(
    async (recipient: GuidedSendRecipient) => {
      if (!recipient.phoneE164) {
        setToastMessage("Cannot share: phone number is invalid");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      const result = await openComposeWebShare(recipient.renderedMessage);
      if (result.method === "FAILED") {
        setToastMessage("Share not available");
        setTimeout(() => setToastMessage(null), 3000);
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-foreground-muted">Loading session...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-foreground-muted">
            {error || "Session not found"}
          </div>
          {onBack && (
            <Button onClick={onBack} className="mt-4" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const { counts, recipients, nextRecipientId } = session;
  const currentRecipient = recipients.find((r) => r.id === nextRecipientId);

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-background-secondary border border-border rounded-lg px-4 py-2 shadow-lg z-50">
          <div className="text-sm text-foreground">{toastMessage}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{campaignName}</h2>
          <p className="text-sm text-foreground-muted">
            {counts.remaining} of {counts.actionableTotal} remaining
          </p>
        </div>
        {onBack && (
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-background-tertiary rounded-full h-2">
        <div
          className="bg-accent h-2 rounded-full transition-all"
          style={{
            width: `${counts.actionableTotal > 0 ? (counts.sent / counts.actionableTotal) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Current recipient card */}
      {currentRecipient ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {currentRecipient.candidate?.name || "Candidate"}
              </CardTitle>
              <div className="flex gap-2">
                {currentRecipient.status === "BLOCKED" && (
                  <Badge variant="destructive">
                    {currentRecipient.blockedReason === "OPTED_OUT"
                      ? "Opted Out"
                      : currentRecipient.blockedReason === "INVALID_PHONE"
                      ? "Invalid Phone"
                      : "Consent Unknown"}
                  </Badge>
                )}
                {currentRecipient.status === "OPENED" && (
                  <Badge variant="warning">Opened</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Candidate info */}
            <div className="text-sm space-y-1">
              <div className="text-foreground-muted">
                {currentRecipient.candidate?.phone || currentRecipient.phoneRaw || "No phone"}
              </div>
              <div className="text-foreground-muted">
                {currentRecipient.candidate?.jobTitle || "No job title"}
              </div>
              {currentRecipient.blockedReason && (
                <div className="flex items-center gap-2 text-status-denied text-xs mt-2">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    {currentRecipient.blockedReason === "OPTED_OUT"
                      ? "Candidate has opted out. Fix in Candidate profile."
                      : currentRecipient.blockedReason === "INVALID_PHONE"
                      ? "Phone number is invalid. Fix in Candidate profile."
                      : "SMS consent unknown. Fix in Candidate profile."}
                  </span>
                </div>
              )}
            </div>

            {/* Message preview */}
            <div className="p-3 bg-background rounded border border-border">
              <div className="text-xs text-foreground-muted mb-1">
                {splitMessageConfig ? 
                  `Message ${currentRecipient.currentMessagePart ?? 1} Preview:` : 
                  "Message Preview:"}
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {splitMessageConfig && currentRecipient.currentMessagePart ? 
                  getMessageForPart(currentRecipient, currentRecipient.currentMessagePart as 1 | 2 | 3) :
                  currentRecipient.renderedMessage}
              </div>
            </div>

            {/* Actions */}
            {splitMessageConfig ? (
              // Split mode: show part-specific buttons
              <div className="space-y-2">
                {(!currentRecipient.currentMessagePart || currentRecipient.currentMessagePart === 1) && (
                  <>
                    <Button
                      onClick={() => handleOpenSMS(currentRecipient, 1)}
                      disabled={updating === currentRecipient.id || !currentRecipient.phoneE164}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Send Message 1
                    </Button>
                    {currentRecipient.status === "OPENED" && (
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          onClick={() => handleMarkSent(currentRecipient.id, 1)}
                          disabled={updating === currentRecipient.id}
                          variant="outline"
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Sent Message 1
                        </Button>
                        <Button
                          onClick={() => handleSkip(currentRecipient.id)}
                          disabled={updating === currentRecipient.id}
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Skip
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {currentRecipient.currentMessagePart === 2 && (
                  <>
                    <Button
                      onClick={() => handleSendMessage2(currentRecipient)}
                      disabled={updating === currentRecipient.id || !currentRecipient.phoneE164}
                      className="w-full"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Send Link
                    </Button>
                    {currentRecipient.status === "OPENED" && (
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          onClick={() => handleMarkSent(currentRecipient.id, 2)}
                          disabled={updating === currentRecipient.id}
                          variant="outline"
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {splitMessageConfig.hasMessage3 ? "Sent Link" : "Complete"}
                        </Button>
                        <Button
                          onClick={() => handleSkip(currentRecipient.id)}
                          disabled={updating === currentRecipient.id}
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Skip
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {currentRecipient.currentMessagePart === 3 && (
                  <>
                    <Button
                      onClick={() => handleSendMessage3(currentRecipient)}
                      disabled={updating === currentRecipient.id || !currentRecipient.phoneE164}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Send Follow-up
                    </Button>
                    {currentRecipient.status === "OPENED" && (
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          onClick={() => handleMarkSent(currentRecipient.id, 3)}
                          disabled={updating === currentRecipient.id}
                          variant="outline"
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                        <Button
                          onClick={() => handleSkip(currentRecipient.id)}
                          disabled={updating === currentRecipient.id}
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Skip
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // Non-split mode: original behavior
              <>
                <div className="flex gap-2">
                  {currentRecipient.status !== "BLOCKED" && currentRecipient.phoneE164 && (
                    <>
                      <Button
                        onClick={() => handleOpenSMS(currentRecipient)}
                        disabled={updating === currentRecipient.id}
                        className="flex-1"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open SMS
                      </Button>
                      <Button
                        onClick={() => handleShare(currentRecipient)}
                        variant="outline"
                        size="sm"
                        title="Share instead"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => handleCopy(currentRecipient.renderedMessage)}
                    variant="outline"
                    size="sm"
                    title="Copy message"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Secondary actions */}
                {currentRecipient.status === "OPENED" && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      onClick={() => handleMarkSent(currentRecipient.id)}
                      disabled={updating === currentRecipient.id}
                      variant="outline"
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Sent
                    </Button>
                    <Button
                      onClick={() => handleSkip(currentRecipient.id)}
                      disabled={updating === currentRecipient.id}
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-foreground-muted">
            {counts.remaining === 0 ? (
              <div>
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-status-hired" />
                <div className="font-semibold mb-2">Session Complete!</div>
                <div className="text-sm">
                  {counts.sent} sent, {counts.skipped} skipped
                </div>
              </div>
            ) : (
              <div>No more actionable recipients</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Return prompt */}
      <ReturnPrompt
        isOpen={showReturnPrompt}
        onClose={() => {
          setShowReturnPrompt(false);
          returnDetection.setLastOpenedRecipientId(undefined);
        }}
        onConfirm={handleReturnConfirm}
        recipientName={
          returnPromptRecipientId
            ? recipients.find((r) => r.id === returnPromptRecipientId)?.candidate?.name
            : undefined
        }
      />
    </div>
  );
}
