import type { FilterState } from "./filtering";
import type { CandidateStatus } from "@/types";

/**
 * Valid candidate status values
 */
const VALID_STATUSES: CandidateStatus[] = [
  "pending",
  "interviewed",
  "hired",
  "denied",
  "consent-form-sent",
];

/**
 * Maximum length for string fields
 */
const MAX_STRING_LENGTH = 200;

/**
 * Result of filter validation
 */
export interface FilterValidationResult {
  filters: FilterState;
  warnings: string[];
}

/**
 * Validate and normalize filters - choke point ensuring only valid FilterState escapes
 * 
 * This function:
 * - Validates field existence on Candidate model
 * - Clamps values to allowed sets
 * - Returns partial filters with warnings for invalid values
 */
export function validateAndNormalizeFilters(
  rawFilters: Partial<FilterState>
): FilterValidationResult {
  const filters: FilterState = {
    status: [],
    clients: [],
    sources: [],
    locations: [],
    dateRange: { start: "", end: "" },
    search: "",
  };
  const warnings: string[] = [];

  // Validate status array
  if (rawFilters.status && Array.isArray(rawFilters.status)) {
    for (const status of rawFilters.status) {
      const normalizedStatus = status.toLowerCase() as CandidateStatus;
      if (VALID_STATUSES.includes(normalizedStatus)) {
        if (!filters.status.includes(normalizedStatus)) {
          filters.status.push(normalizedStatus);
        }
      } else {
        warnings.push(`Ignored unknown status '${status}'`);
      }
    }
  }

  // Validate and normalize client array
  if (rawFilters.clients && Array.isArray(rawFilters.clients)) {
    for (const client of rawFilters.clients) {
      if (typeof client === "string") {
        const trimmed = client.trim().substring(0, MAX_STRING_LENGTH);
        if (trimmed && !filters.clients.includes(trimmed)) {
          filters.clients.push(trimmed);
        }
      }
    }
  }

  // Validate and normalize location array
  if (rawFilters.locations && Array.isArray(rawFilters.locations)) {
    for (const location of rawFilters.locations) {
      if (typeof location === "string") {
        const trimmed = location.trim().substring(0, MAX_STRING_LENGTH);
        if (trimmed && !filters.locations.includes(trimmed)) {
          filters.locations.push(trimmed);
        }
      }
    }
  }

  // Validate and normalize source array
  if (rawFilters.sources && Array.isArray(rawFilters.sources)) {
    for (const source of rawFilters.sources) {
      if (typeof source === "string") {
        const trimmed = source.trim().substring(0, MAX_STRING_LENGTH);
        if (trimmed && !filters.sources.includes(trimmed)) {
          filters.sources.push(trimmed);
        }
      }
    }
  }

  // Validate date range
  if (rawFilters.dateRange) {
    if (rawFilters.dateRange.start) {
      const startDate = new Date(rawFilters.dateRange.start);
      if (!isNaN(startDate.getTime())) {
        filters.dateRange.start = startDate.toISOString().split("T")[0];
      } else {
        warnings.push(`Invalid start date: ${rawFilters.dateRange.start}`);
      }
    }

    if (rawFilters.dateRange.end) {
      const endDate = new Date(rawFilters.dateRange.end);
      if (!isNaN(endDate.getTime())) {
        filters.dateRange.end = endDate.toISOString().split("T")[0];
      } else {
        warnings.push(`Invalid end date: ${rawFilters.dateRange.end}`);
      }
    }

    // Ensure start is before end
    if (filters.dateRange.start && filters.dateRange.end) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      if (start > end) {
        warnings.push("Start date is after end date, swapping dates");
        [filters.dateRange.start, filters.dateRange.end] = [
          filters.dateRange.end,
          filters.dateRange.start,
        ];
      }
    }
  }

  // Validate search string
  if (rawFilters.search && typeof rawFilters.search === "string") {
    filters.search = rawFilters.search.trim().substring(0, MAX_STRING_LENGTH);
  }

  return { filters, warnings };
}

/**
 * Extract simple patterns from natural language queries
 * Returns FilterState if patterns are found, null otherwise
 * 
 * This is a deterministic parser for common patterns to reduce LLM costs.
 * If this returns a non-empty FilterState, we can skip LLM for filter suggestions.
 */
export function extractSimplePatterns(query: string): FilterState | null {
  const lowerQuery = query.toLowerCase().trim();
  const filters: FilterState = {
    status: [],
    clients: [],
    sources: [],
    locations: [],
    dateRange: { start: "", end: "" },
    search: "",
  };

  let hasPatterns = false;

  // Pattern: "in {city}" or "in {location}"
  const inLocationMatch = lowerQuery.match(/\bin\s+([^,\.\?]+?)(?:\s|$|,|\.|\?)/);
  if (inLocationMatch) {
    const location = inLocationMatch[1].trim();
    if (location && location.length > 1) {
      filters.locations.push(location);
      hasPatterns = true;
    }
  }

  // Pattern: "for client {name}" or "client {name}"
  const clientMatch = lowerQuery.match(/(?:for\s+)?client\s+([^,\.\?]+?)(?:\s|$|,|\.|\?)/i);
  if (clientMatch) {
    const client = clientMatch[1].trim();
    if (client && client.length > 1) {
      filters.clients.push(client);
      hasPatterns = true;
    }
  }

  // Pattern: "{status} candidates" or "candidates with status {status}"
  for (const status of VALID_STATUSES) {
    const statusPattern = new RegExp(`\\b${status}\\b`, "i");
    if (statusPattern.test(lowerQuery)) {
      filters.status.push(status);
      hasPatterns = true;
      break; // Only match first status found
    }
  }

  // Pattern: "pending candidates", "hired candidates", etc.
  const statusKeywords: Record<string, CandidateStatus> = {
    pending: "pending",
    interviewed: "interviewed",
    hired: "hired",
    denied: "denied",
    "consent form": "consent-form-sent",
    "consent-form": "consent-form-sent",
  };

  for (const [keyword, status] of Object.entries(statusKeywords)) {
    if (lowerQuery.includes(keyword) && lowerQuery.includes("candidate")) {
      if (!filters.status.includes(status)) {
        filters.status.push(status);
        hasPatterns = true;
      }
    }
  }

  // Pattern: "last month", "this month", "last week"
  const now = new Date();
  if (lowerQuery.includes("last month")) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    filters.dateRange.start = lastMonth.toISOString().split("T")[0];
    filters.dateRange.end = thisMonth.toISOString().split("T")[0];
    hasPatterns = true;
  } else if (lowerQuery.includes("this month")) {
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    filters.dateRange.start = thisMonth.toISOString().split("T")[0];
    filters.dateRange.end = now.toISOString().split("T")[0];
    hasPatterns = true;
  } else if (lowerQuery.includes("last week")) {
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    filters.dateRange.start = lastWeek.toISOString().split("T")[0];
    filters.dateRange.end = now.toISOString().split("T")[0];
    hasPatterns = true;
  }

  // Return filters only if we found patterns
  if (hasPatterns) {
    return filters;
  }

  return null;
}

/**
 * Check if a FilterState has any active filters
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.status.length > 0 ||
    filters.clients.length > 0 ||
    filters.sources.length > 0 ||
    filters.locations.length > 0 ||
    filters.dateRange.start !== "" ||
    filters.dateRange.end !== "" ||
    filters.search.trim() !== ""
  );
}
