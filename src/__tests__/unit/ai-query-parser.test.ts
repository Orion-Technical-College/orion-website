/**
 * @jest-environment node
 */

import { describe, it, expect } from "@jest/globals";
import {
  validateAndNormalizeFilters,
  extractSimplePatterns,
  hasActiveFilters,
} from "@/lib/ai-query-parser";
import type { FilterState } from "@/lib/filtering";

describe("AI Query Parser", () => {
  describe("validateAndNormalizeFilters", () => {
    it("should accept valid status values", () => {
      const rawFilters = {
        status: ["pending", "hired", "interviewed"],
      };

      const result = validateAndNormalizeFilters(rawFilters);
      expect(result.filters.status).toEqual(["pending", "hired", "interviewed"]);
      expect(result.warnings).toHaveLength(0);
    });

    it("should reject invalid status values with warnings", () => {
      const rawFilters = {
        status: ["pending", "INVALID_STATUS", "hired"],
      };

      const result = validateAndNormalizeFilters(rawFilters);
      expect(result.filters.status).toEqual(["pending", "hired"]);
      expect(result.warnings).toContain("Ignored unknown status 'INVALID_STATUS'");
    });

    it("should normalize status to lowercase", () => {
      const rawFilters = {
        status: ["PENDING", "HIRED"],
      };

      const result = validateAndNormalizeFilters(rawFilters);
      expect(result.filters.status).toEqual(["pending", "hired"]);
    });

    it("should trim and limit string fields", () => {
      const longString = "x".repeat(300);
      const rawFilters = {
        clients: ["  Client A  ", longString],
        locations: ["  Location B  "],
      };

      const result = validateAndNormalizeFilters(rawFilters);
      expect(result.filters.clients).toContain("Client A");
      expect(result.filters.clients[1].length).toBeLessThanOrEqual(200);
      expect(result.filters.locations).toContain("Location B");
    });

    it("should validate date range", () => {
      const rawFilters = {
        dateRange: {
          start: "2025-01-01",
          end: "2025-01-31",
        },
      };

      const result = validateAndNormalizeFilters(rawFilters);
      expect(result.filters.dateRange.start).toBe("2025-01-01");
      expect(result.filters.dateRange.end).toBe("2025-01-31");
    });

    it("should reject invalid dates with warnings", () => {
      const rawFilters = {
        dateRange: {
          start: "invalid-date",
          end: "2025-01-31",
        },
      };

      const result = validateAndNormalizeFilters(rawFilters);
      expect(result.warnings).toContain("Invalid start date: invalid-date");
      expect(result.filters.dateRange.end).toBe("2025-01-31");
    });

    it("should swap dates if start is after end", () => {
      const rawFilters = {
        dateRange: {
          start: "2025-01-31",
          end: "2025-01-01",
        },
      };

      const result = validateAndNormalizeFilters(rawFilters);
      expect(result.warnings).toContain("Start date is after end date, swapping dates");
      expect(result.filters.dateRange.start).toBe("2025-01-01");
      expect(result.filters.dateRange.end).toBe("2025-01-31");
    });

    it("should handle empty filters", () => {
      const result = validateAndNormalizeFilters({});
      expect(result.filters.status).toEqual([]);
      expect(result.filters.clients).toEqual([]);
      expect(result.warnings).toEqual([]);
    });
  });

  describe("extractSimplePatterns", () => {
    it("should extract location from 'in {city}' pattern", () => {
      const result = extractSimplePatterns("Show me candidates in Oakland");
      expect(result).not.toBeNull();
      expect(result?.locations).toContain("oakland");
    });

    it("should extract client from 'for client {name}' pattern", () => {
      const result = extractSimplePatterns("Find candidates for client Acme Corp");
      expect(result).not.toBeNull();
      expect(result?.clients.length).toBeGreaterThan(0);
    });

    it("should extract status from 'pending candidates' pattern", () => {
      const result = extractSimplePatterns("Show me pending candidates");
      expect(result).not.toBeNull();
      expect(result?.status).toContain("pending");
    });

    it("should extract status from 'hired' keyword", () => {
      const result = extractSimplePatterns("Who was hired last month?");
      expect(result).not.toBeNull();
      expect(result?.status).toContain("hired");
    });

    it("should extract date range from 'last month'", () => {
      const result = extractSimplePatterns("Candidates hired last month");
      expect(result).not.toBeNull();
      expect(result?.dateRange.start).toBeTruthy();
      expect(result?.dateRange.end).toBeTruthy();
    });

    it("should return null for queries without simple patterns", () => {
      const result = extractSimplePatterns("What is the weather today?");
      expect(result).toBeNull();
    });

    it("should handle multiple patterns", () => {
      const result = extractSimplePatterns("Show me pending candidates in Oakland");
      expect(result).not.toBeNull();
      expect(result?.status).toContain("pending");
      expect(result?.locations.length).toBeGreaterThan(0);
    });
  });

  describe("hasActiveFilters", () => {
    it("should return true if status filter is active", () => {
      const filters: FilterState = {
        status: ["pending"],
        clients: [],
        sources: [],
        locations: [],
        dateRange: { start: "", end: "" },
        search: "",
      };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it("should return true if search is active", () => {
      const filters: FilterState = {
        status: [],
        clients: [],
        sources: [],
        locations: [],
        dateRange: { start: "", end: "" },
        search: "test",
      };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it("should return true if date range is active", () => {
      const filters: FilterState = {
        status: [],
        clients: [],
        sources: [],
        locations: [],
        dateRange: { start: "2025-01-01", end: "" },
        search: "",
      };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it("should return false if no filters are active", () => {
      const filters: FilterState = {
        status: [],
        clients: [],
        sources: [],
        locations: [],
        dateRange: { start: "", end: "" },
        search: "",
      };
      expect(hasActiveFilters(filters)).toBe(false);
    });
  });
});
