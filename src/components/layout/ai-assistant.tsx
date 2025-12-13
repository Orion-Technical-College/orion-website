"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Send, Upload, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/types";

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  onUploadCSV: (file: File) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

function AIAssistantComponent({
  isOpen,
  onToggle,
  onUploadCSV,
  messages,
  onSendMessage,
  isLoading = false,
  error = null,
}: AIAssistantProps) {
  const [input, setInput] = useState("");
  const [feedbackStates, setFeedbackStates] = useState<Record<string, "positive" | "negative" | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change (only when panel is open)
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCSV(file);
    }
  };

  const handleFeedback = async (messageId: string, score: "positive" | "negative", traceId?: string, correlationId?: string) => {
    // Update local state immediately for UI feedback
    setFeedbackStates(prev => ({ ...prev, [messageId]: score }));

    try {
      const response = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          score: score === "positive" ? 1 : 0,
          traceId, // Use traceId for proper Langfuse linking
          correlationId, // Keep for audit logging
        }),
      });

      if (!response.ok) {
        console.error("Failed to submit feedback");
        // Revert feedback state on error
        setFeedbackStates(prev => ({ ...prev, [messageId]: null }));
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Revert feedback state on error
      setFeedbackStates(prev => ({ ...prev, [messageId]: null }));
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-accent text-background p-1.5 rounded-l-md shadow-lg hover:bg-accent-hover transition-colors z-50"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
      </button>
    );
  }

  return (
    <aside className="w-64 h-full bg-background-secondary border-l border-border flex flex-col">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="font-semibold text-accent text-sm">AI Assistant</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[11px] text-foreground-muted mt-0.5">
          Upload CSV files and interact with your data
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-[13px] text-red-400 leading-relaxed">{error}</p>
            </div>
          )}
          {messages.length === 0 && !error ? (
            <div className="bg-background-tertiary rounded-md p-3">
              <p className="text-[13px] text-foreground leading-relaxed">
                Hello! I can help you manage data in your workspace. Upload a CSV
                file or describe the data you want to add to the table.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-md p-2.5 text-[13px]",
                  message.role === "user"
                    ? "bg-accent-muted text-foreground ml-6"
                    : "bg-background-tertiary text-foreground mr-6"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1">{message.content}</p>
                  {message.role === "assistant" && (
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => handleFeedback(message.id, "positive", message.traceId, message.correlationId)}
                        className={cn(
                          "p-1 rounded hover:bg-background transition-colors",
                          feedbackStates[message.id] === "positive" && "bg-accent/20"
                        )}
                        title="Helpful"
                        aria-label="Mark as helpful"
                      >
                        <ThumbsUp className={cn(
                          "h-3 w-3",
                          feedbackStates[message.id] === "positive" ? "text-accent fill-accent" : "text-foreground-muted"
                        )} />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, "negative", message.traceId, message.correlationId)}
                        className={cn(
                          "p-1 rounded hover:bg-background transition-colors",
                          feedbackStates[message.id] === "negative" && "bg-red-500/20"
                        )}
                        title="Not helpful"
                        aria-label="Mark as not helpful"
                      >
                        <ThumbsDown className={cn(
                          "h-3 w-3",
                          feedbackStates[message.id] === "negative" ? "text-red-500 fill-red-500" : "text-foreground-muted"
                        )} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="bg-background-tertiary rounded-md p-2.5 mr-6">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border space-y-2">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center overflow-visible">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your data..."
            className="flex-1 min-w-0 bg-background-tertiary border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 transition-all"
            disabled={isLoading}
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && input.trim() && !isLoading) {
                e.preventDefault();
                onSendMessage(input.trim());
                setInput("");
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex-shrink-0 rounded-lg px-3 py-2.5 h-[39px] min-w-[65px] flex items-center justify-center gap-1.5",
              "transition-all duration-200 font-medium text-[13px] border-2",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1",
              input.trim() && !isLoading
                ? "bg-accent text-white hover:bg-accent-hover shadow-md border-accent cursor-pointer"
                : "bg-background-tertiary text-foreground-muted border-border cursor-not-allowed opacity-100"
            )}
            aria-label="Send message"
            title={!input.trim() ? "Type a message to send" : "Send message"}
          >
            <Send className={cn("h-3.5 w-3.5 flex-shrink-0", input.trim() && !isLoading ? "text-white" : "text-foreground-muted")} />
            <span className="text-[13px] font-semibold whitespace-nowrap">Send</span>
          </button>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full text-[13px] h-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Upload CSV/Excel
        </Button>
      </div>
    </aside>
  );
}

// Memoize to prevent re-renders when props haven't changed
// Note: We compare props, but local state (input) will still trigger re-renders
export const AIAssistant = React.memo(AIAssistantComponent, (prevProps, nextProps) => {
  // Only skip re-render if these specific props haven't changed
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.messages === nextProps.messages &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.onSendMessage === nextProps.onSendMessage &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onUploadCSV === nextProps.onUploadCSV
  );
});
AIAssistant.displayName = "AIAssistant";

