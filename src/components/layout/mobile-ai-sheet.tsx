"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Send, Upload, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/types";

interface MobileAISheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadCSV: (file: File) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function MobileAISheet({
  isOpen,
  onClose,
  onUploadCSV,
  messages,
  onSendMessage,
  isLoading = false,
  error = null,
}: MobileAISheetProps) {
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 md:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background-secondary rounded-t-2xl z-50 md:hidden",
          "transform transition-transform duration-300 ease-out",
          "max-h-[85vh] flex flex-col",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="font-semibold text-accent">AI Assistant</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[200px] max-h-[50vh]">
          <div className="space-y-3">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            {messages.length === 0 && !error ? (
              <div className="bg-background-tertiary rounded-lg p-4">
                <p className="text-sm text-foreground">
                  Hello! I can help you manage data in your workspace. Upload a CSV
                  file or describe the data you want to add.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg p-3 text-sm",
                    message.role === "user"
                      ? "bg-accent-muted text-foreground ml-8"
                      : "bg-background-tertiary text-foreground mr-8"
                  )}
                >
                  {message.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="bg-background-tertiary rounded-lg p-3 mr-8">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse delay-75" />
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse delay-150" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border space-y-3 pb-safe">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about your data..."
              className="flex-1 bg-background-tertiary border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-12 w-12"
            >
              <Send className="h-5 w-5" />
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
            className="w-full h-12"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload CSV/Excel
          </Button>
        </div>
      </div>
    </>
  );
}

