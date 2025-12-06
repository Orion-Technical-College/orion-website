"use client";

import React, { useMemo } from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Candidate, CandidateStatus } from "@/types";

export interface FilterState {
  status: CandidateStatus[];
  clients: string[];
  sources: string[];
  locations: string[];
  dateRange: {
    start: string;
    end: string;
  };
  search: string;
}

interface FilterPanelProps {
  data: Candidate[];
  filters: FilterState;
  onFiltersChange: (newFilters: FilterState) => void;
  onClearAll: () => void;
  showUnresolvedOnly: boolean;
  onToggleUnresolved: () => void;
}

export function FilterPanel({
  data,
  filters,
  onFiltersChange,
  onClearAll,
  showUnresolvedOnly,
  onToggleUnresolved,
}: FilterPanelProps) {
  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const statuses = new Set<CandidateStatus>();
    const clients = new Set<string>();
    const sources = new Set<string>();
    const locations = new Set<string>();

    data.forEach((candidate) => {
      if (candidate.status) statuses.add(candidate.status);
      if (candidate.client) clients.add(candidate.client);
      if (candidate.source) sources.add(candidate.source);
      if (candidate.location) locations.add(candidate.location);
    });

    return {
      statuses: Array.from(statuses).sort(),
      clients: Array.from(clients).sort(),
      sources: Array.from(sources).sort(),
      locations: Array.from(locations).sort(),
    };
  }, [data]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.clients.length > 0) count++;
    if (filters.sources.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.search) count++;
    if (showUnresolvedOnly) count++;
    return count;
  }, [filters, showUnresolvedOnly]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <K extends "status" | "clients" | "sources" | "locations">(
    key: K,
    value: string
  ) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated as FilterState[K]);
  };

  return (
    <div className="space-y-3">
      {/* Active Filters Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border">
          <span className="text-[11px] text-foreground-muted">Active filters:</span>
          {showUnresolvedOnly && (
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 bg-accent-muted text-accent border-accent"
            >
              Unresolved Only
              <button
                onClick={onToggleUnresolved}
                className="ml-1.5 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              Status: {filters.status.length}
              <button
                onClick={() => updateFilter("status", [])}
                className="ml-1.5 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.clients.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              Clients: {filters.clients.length}
              <button
                onClick={() => updateFilter("clients", [])}
                className="ml-1.5 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.sources.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              Sources: {filters.sources.length}
              <button
                onClick={() => updateFilter("sources", [])}
                className="ml-1.5 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.locations.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              Locations: {filters.locations.length}
              <button
                onClick={() => updateFilter("locations", [])}
                className="ml-1.5 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.dateRange.start || filters.dateRange.end) && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              Date Range
              <button
                onClick={() => updateFilter("dateRange", { start: "", end: "" })}
                className="ml-1.5 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.search && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              Search: &quot;{filters.search}&quot;
              <button
                onClick={() => updateFilter("search", "")}
                className="ml-1.5 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-5 px-2 text-[10px] text-foreground-muted hover:text-foreground"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Search */}
        <div className="lg:col-span-2">
          <Input
            placeholder="Search all columns..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="h-7 text-[11px]"
          />
        </div>

        {/* Status Multi-Select */}
        <div className="relative">
          <Select
            value={filters.status.length > 0 ? "multiple" : "all"}
            onValueChange={() => {}} // Controlled by checkboxes
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue
                placeholder={
                  filters.status.length > 0
                    ? `${filters.status.length} selected`
                    : "Status"
                }
              />
            </SelectTrigger>
            <SelectContent className="w-[200px]">
              <div className="px-2 py-1.5 border-b border-border">
                <button
                  onClick={() => updateFilter("status", [])}
                  className="text-[11px] text-foreground-muted hover:text-foreground w-full text-left"
                >
                  Clear all
                </button>
              </div>
              {filterOptions.statuses.map((status) => (
                <div key={status} className="px-2 py-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <Checkbox
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => toggleArrayFilter("status", status)}
                    />
                    <span className="capitalize">{status.replace("-", " ")}</span>
                  </label>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Client Multi-Select */}
        <div className="relative">
          <Select
            value={filters.clients.length > 0 ? "multiple" : "all"}
            onValueChange={() => {}}
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue
                placeholder={
                  filters.clients.length > 0
                    ? `${filters.clients.length} selected`
                    : "Client"
                }
              />
            </SelectTrigger>
            <SelectContent className="w-[200px]">
              <div className="px-2 py-1.5 border-b border-border">
                <button
                  onClick={() => updateFilter("clients", [])}
                  className="text-[11px] text-foreground-muted hover:text-foreground w-full text-left"
                >
                  Clear all
                </button>
              </div>
              {filterOptions.clients.map((client) => (
                <div key={client} className="px-2 py-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <Checkbox
                      checked={filters.clients.includes(client)}
                      onCheckedChange={() => toggleArrayFilter("clients", client)}
                    />
                    <span>{client}</span>
                  </label>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Source Multi-Select */}
        <div className="relative">
          <Select
            value={filters.sources.length > 0 ? "multiple" : "all"}
            onValueChange={() => {}}
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue
                placeholder={
                  filters.sources.length > 0
                    ? `${filters.sources.length} selected`
                    : "Source"
                }
              />
            </SelectTrigger>
            <SelectContent className="w-[200px]">
              <div className="px-2 py-1.5 border-b border-border">
                <button
                  onClick={() => updateFilter("sources", [])}
                  className="text-[11px] text-foreground-muted hover:text-foreground w-full text-left"
                >
                  Clear all
                </button>
              </div>
              {filterOptions.sources.map((source) => (
                <div key={source} className="px-2 py-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <Checkbox
                      checked={filters.sources.includes(source)}
                      onCheckedChange={() => toggleArrayFilter("sources", source)}
                    />
                    <span>{source}</span>
                  </label>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Multi-Select */}
        <div className="relative">
          <Select
            value={filters.locations.length > 0 ? "multiple" : "all"}
            onValueChange={() => {}}
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue
                placeholder={
                  filters.locations.length > 0
                    ? `${filters.locations.length} selected`
                    : "Location"
                }
              />
            </SelectTrigger>
            <SelectContent className="w-[200px]">
              <div className="px-2 py-1.5 border-b border-border">
                <button
                  onClick={() => updateFilter("locations", [])}
                  className="text-[11px] text-foreground-muted hover:text-foreground w-full text-left"
                >
                  Clear all
                </button>
              </div>
              {filterOptions.locations.map((location) => (
                <div key={location} className="px-2 py-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <Checkbox
                      checked={filters.locations.includes(location)}
                      onCheckedChange={() => toggleArrayFilter("locations", location)}
                    />
                    <span>{location}</span>
                  </label>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Start */}
        <Input
          type="date"
          placeholder="Start Date"
          value={filters.dateRange.start}
          onChange={(e) =>
            updateFilter("dateRange", { ...filters.dateRange, start: e.target.value })
          }
          className="h-7 text-[11px]"
        />

        {/* Date Range End */}
        <Input
          type="date"
          placeholder="End Date"
          value={filters.dateRange.end}
          onChange={(e) =>
            updateFilter("dateRange", { ...filters.dateRange, end: e.target.value })
          }
          className="h-7 text-[11px]"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={showUnresolvedOnly ? "default" : "outline"}
          size="sm"
          onClick={onToggleUnresolved}
          className="h-7 text-[11px] px-2.5"
        >
          <Filter className="h-3 w-3 mr-1.5" />
          Show Unresolved Only
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            updateFilter("status", ["pending", "interviewed", "consent-form-sent"]);
          }}
          className="h-7 text-[11px] px-2.5"
        >
          Active Candidates
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            updateFilter("status", ["hired"]);
          }}
          className="h-7 text-[11px] px-2.5"
        >
          Hired Only
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            updateFilter("status", ["denied"]);
          }}
          className="h-7 text-[11px] px-2.5"
        >
          Denied Only
        </Button>
      </div>
    </div>
  );
}

