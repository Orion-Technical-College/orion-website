"use client";

import React from "react";
import { cn, formatPhoneNumber, getStatusColor, generateSmsUri } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Building2, Briefcase, MessageSquare } from "lucide-react";
import type { Candidate } from "@/types";

interface CandidateCardProps {
  candidate: Candidate;
  isSelected?: boolean;
  onSelect?: () => void;
  onQuickSend?: () => void;
}

export function CandidateCard({ candidate, isSelected, onSelect, onQuickSend }: CandidateCardProps) {
  const handleQuickSend = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open SMS with a basic message
    const message = `Hi ${candidate.name.split(" ")[0]}, `;
    const smsUri = generateSmsUri(candidate.phone, message);
    window.open(smsUri, "_blank");
    onQuickSend?.();
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "bg-background-secondary rounded-lg border p-4 transition-all active:scale-[0.98]",
        isSelected ? "border-accent bg-accent-muted/30" : "border-border",
        onSelect && "cursor-pointer"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{candidate.name}</h3>
          <p className="text-sm text-foreground-muted truncate">{candidate.jobTitle}</p>
        </div>
        <Badge className={cn("flex-shrink-0 capitalize text-xs", getStatusColor(candidate.status))}>
          {candidate.status.replace("-", " ")}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-foreground-muted">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{candidate.client}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground-muted">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{candidate.location}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground-muted">
          <Briefcase className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{candidate.source} • {candidate.date}</span>
        </div>
      </div>

      {/* Notes */}
      {candidate.notes && (
        <p className="mt-3 text-sm text-foreground-muted bg-background-tertiary rounded px-2 py-1.5 line-clamp-2">
          {candidate.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <a
          href={`tel:${candidate.phone.replace(/\D/g, "")}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-lg bg-background-tertiary text-foreground hover:bg-border transition-colors"
        >
          <Phone className="h-4 w-4" />
          <span className="text-sm">{formatPhoneNumber(candidate.phone)}</span>
        </a>
        <button
          onClick={handleQuickSend}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent text-background font-medium hover:bg-accent-hover transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm">SMS</span>
        </button>
      </div>

      {/* Email */}
      <a
        href={`mailto:${candidate.email}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-2 mt-2 text-sm text-accent hover:underline"
      >
        <Mail className="h-4 w-4" />
        <span className="truncate">{candidate.email}</span>
      </a>
    </div>
  );
}

