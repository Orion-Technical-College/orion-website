"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Send, Upload, Sparkles } from "lucide-react";
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
}

export function AIAssistant({
  isOpen,
  onToggle,
  onUploadCSV,
  messages,
  onSendMessage,
  isLoading = false,
}: AIAssistantProps) {
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <aside className="w-56 h-full bg-background-secondary border-l border-border flex flex-col">
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
          {messages.length === 0 ? (
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
                {message.content}
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
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your data..."
            className="flex-1 bg-background-tertiary border border-border rounded-md px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-8 w-8">
            <Send className="h-3.5 w-3.5" />
          </Button>
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
          className="w-full text-[13px]"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Upload CSV/Excel
        </Button>
      </div>
    </aside>
  );
}

