import type { Candidate, CandidateStatus } from "@/types";

export interface FilterState {
  status: CandidateStatus[];
  clients: string[];
  sources: string[];
  locations: string[];
  dateRange: { start: string; end: string };
  search: string;
}

/**
 * Pure filtering function for candidates.
 * Extracted from data-table component for unit testability.
 */
export function applyCandidateFilters(
  candidates: Candidate[],
  filters: FilterState,
  showUnresolvedOnly: boolean = false
): Candidate[] {
  let result = [...candidates];

  // Unresolved filter
  if (showUnresolvedOnly) {
    result = result.filter(
      (c) => c.status?.toLowerCase() !== "hired" && c.status?.toLowerCase() !== "denied"
    );
  }

  // Status filter
  if (filters.status.length > 0) {
    result = result.filter((c) => filters.status.includes(c.status));
  }

  // Client filter
  if (filters.clients.length > 0) {
    result = result.filter((c) => filters.clients.includes(c.client));
  }

  // Source filter
  if (filters.sources.length > 0) {
    result = result.filter((c) => filters.sources.includes(c.source));
  }

  // Location filter
  if (filters.locations.length > 0) {
    result = result.filter((c) => filters.locations.includes(c.location));
  }

  // Date range filter
  if (filters.dateRange.start || filters.dateRange.end) {
    result = result.filter((c) => {
      if (!c.date) return false;
      const candidateDate = new Date(c.date);
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (candidateDate < startDate) return false;
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include entire end date
        if (candidateDate > endDate) return false;
      }
      return true;
    });
  }

  // Global search
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter((c) => {
      return (
        c.name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower) ||
        c.jobTitle?.toLowerCase().includes(searchLower) ||
        c.location?.toLowerCase().includes(searchLower) ||
        c.client?.toLowerCase().includes(searchLower) ||
        c.source?.toLowerCase().includes(searchLower) ||
        c.notes?.toLowerCase().includes(searchLower)
      );
    });
  }

  return result;
}

