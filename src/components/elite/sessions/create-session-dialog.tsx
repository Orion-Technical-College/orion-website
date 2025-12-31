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
import { useEliteContext } from "@/components/elite/layout";

interface CreateSessionDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultCohortId?: string;
}

interface Cohort {
  id: string;
  name: string;
  timezone: string;
}

export function CreateSessionDialog({
  open,
  onClose,
  onCreated,
  defaultCohortId,
}: CreateSessionDialogProps) {
  const { context } = useEliteContext();

  const [title, setTitle] = useState("");
  const [cohortId, setCohortId] = useState(defaultCohortId ?? "");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [zoomUrl, setZoomUrl] = useState("");

  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loadingCohorts, setLoadingCohorts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cohorts
  useEffect(() => {
    async function fetchCohorts() {
      try {
        setLoadingCohorts(true);
        const res = await fetch("/api/elite/cohorts");
        if (res.ok) {
          const data = await res.json();
          setCohorts(data);
          // Set default cohort if provided or use first cohort
          if (defaultCohortId) {
            setCohortId(defaultCohortId);
            const cohort = data.find((c: Cohort) => c.id === defaultCohortId);
            if (cohort) setTimezone(cohort.timezone);
          } else if (data.length > 0 && !cohortId) {
            setCohortId(data[0].id);
            setTimezone(data[0].timezone);
          }
        }
      } catch (err) {
        console.error("Failed to fetch cohorts:", err);
      } finally {
        setLoadingCohorts(false);
      }
    }

    if (open) {
      fetchCohorts();
    }
  }, [open, defaultCohortId]);

  // Update timezone when cohort changes
  const handleCohortChange = (newCohortId: string) => {
    setCohortId(newCohortId);
    const cohort = cohorts.find((c) => c.id === newCohortId);
    if (cohort) {
      setTimezone(cohort.timezone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Session title is required");
      return;
    }

    if (!cohortId) {
      setError("Please select a cohort");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setError("Please select a date and time");
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 480) {
      setError("Duration must be between 15 and 480 minutes");
      return;
    }

    try {
      setSubmitting(true);

      // Combine date and time
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

      const body: Record<string, unknown> = {
        cohortId,
        title: title.trim(),
        scheduledAt: scheduledAt.toISOString(),
        timezone,
        duration: durationNum,
      };

      if (description.trim()) {
        body.description = description.trim();
      }

      if (zoomUrl.trim()) {
        body.zoomUrl = zoomUrl.trim();
      }

      const res = await fetch("/api/elite/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create session");
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
      setTitle("");
      setDescription("");
      setScheduledDate("");
      setScheduledTime("");
      setDuration("60");
      setZoomUrl("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Schedule Session</DialogTitle>
            <DialogDescription>
              Create a new training session for a cohort.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Week 1: Introduction to Leadership"
                disabled={submitting}
              />
            </div>

            {/* Cohort */}
            <div className="grid gap-2">
              <Label htmlFor="cohort">Cohort *</Label>
              <select
                id="cohort"
                value={cohortId}
                onChange={(e) => handleCohortChange(e.target.value)}
                disabled={submitting || loadingCohorts}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a cohort...</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Duration and Timezone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional session description..."
                disabled={submitting}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Zoom URL */}
            <div className="grid gap-2">
              <Label htmlFor="zoomUrl">Zoom URL</Label>
              <Input
                id="zoomUrl"
                type="url"
                value={zoomUrl}
                onChange={(e) => setZoomUrl(e.target.value)}
                placeholder="https://zoom.us/j/..."
                disabled={submitting}
              />
              <p className="text-xs text-foreground-muted">
                Optional video conference link
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
              Schedule Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

