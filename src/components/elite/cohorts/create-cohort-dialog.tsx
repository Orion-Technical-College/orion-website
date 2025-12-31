"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CreateCohortDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ProgramTemplate {
  id: string;
  name: string;
}

export function CreateCohortDialog({
  open,
  onClose,
  onCreated,
}: CreateCohortDialogProps) {
  const [name, setName] = useState("");
  const [programTemplateId, setProgramTemplateId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch program templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoadingTemplates(true);
        // For now, we'll create a default template list
        // In a full implementation, this would fetch from /api/elite/templates
        setTemplates([
          { id: "default", name: "Default Leadership Program" },
        ]);
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Cohort name is required");
      return;
    }

    if (!programTemplateId) {
      setError("Please select a program template");
      return;
    }

    try {
      setSubmitting(true);

      const body: Record<string, unknown> = {
        name: name.trim(),
        programTemplateId,
        timezone,
      };

      if (startDate) {
        body.startDate = new Date(startDate).toISOString();
      }
      if (endDate) {
        body.endDate = new Date(endDate).toISOString();
      }

      const res = await fetch("/api/elite/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create cohort");
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setName("");
      setProgramTemplateId("");
      setStartDate("");
      setEndDate("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Cohort</DialogTitle>
            <DialogDescription>
              Create a new cohort for leadership training. You can add members
              after creating the cohort.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Cohort Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Leadership Cohort 2025"
                disabled={submitting}
              />
            </div>

            {/* Program Template */}
            <div className="grid gap-2">
              <Label htmlFor="template">Program Template *</Label>
              <select
                id="template"
                value={programTemplateId}
                onChange={(e) => setProgramTemplateId(e.target.value)}
                disabled={submitting || loadingTemplates}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g., America/New_York"
                disabled={submitting}
              />
              <p className="text-xs text-foreground-muted">
                IANA timezone for session scheduling
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Cohort
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

