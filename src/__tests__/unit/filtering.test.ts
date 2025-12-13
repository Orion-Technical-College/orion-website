/**
 * @jest-environment node
 */

import { applyCandidateFilters, FilterState } from "@/lib/filtering";
import type { Candidate } from "@/types";

const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "1234567890",
    status: "PENDING",
    client: "Client A",
    source: "LinkedIn",
    location: "Oakland, CA",
    date: "2024-01-15",
    jobTitle: "Software Engineer",
    notes: "Great candidate",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "0987654321",
    status: "CONTACTED",
    client: "Client B",
    source: "Indeed",
    location: "San Francisco, CA",
    date: "2024-01-20",
    jobTitle: "Product Manager",
    notes: "Follow up needed",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    phone: "5555555555",
    status: "HIRED",
    client: "Client A",
    source: "Referral",
    location: "Oakland, CA",
    date: "2024-02-01",
    jobTitle: "Designer",
    notes: "",
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice@example.com",
    phone: "1111111111",
    status: "DENIED",
    client: "Client B",
    source: "LinkedIn",
    location: "Berkeley, CA",
    date: "2024-02-10",
    jobTitle: "Engineer",
    notes: "Not a fit",
  },
];

const emptyFilters: FilterState = {
  status: [],
  clients: [],
  sources: [],
  locations: [],
  dateRange: { start: "", end: "" },
  search: "",
};

describe("filtering", () => {
  describe("applyCandidateFilters", () => {
    it("should return all candidates when no filters applied", () => {
      const result = applyCandidateFilters(mockCandidates, emptyFilters);
      expect(result).toHaveLength(4);
    });

    it("should filter by status (single)", () => {
      const filters = { ...emptyFilters, status: ["PENDING"] };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("PENDING");
    });

    it("should filter by status (multiple)", () => {
      const filters = { ...emptyFilters, status: ["PENDING", "CONTACTED"] };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result).toHaveLength(2);
      expect(result.every((c) => ["PENDING", "CONTACTED"].includes(c.status))).toBe(true);
    });

    it("should filter by client", () => {
      const filters = { ...emptyFilters, clients: ["Client A"] };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.client === "Client A")).toBe(true);
    });

    it("should filter by source", () => {
      const filters = { ...emptyFilters, sources: ["LinkedIn"] };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.source === "LinkedIn")).toBe(true);
    });

    it("should filter by location", () => {
      const filters = { ...emptyFilters, locations: ["Oakland, CA"] };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.location === "Oakland, CA")).toBe(true);
    });

    it("should filter by date range (start date only)", () => {
      const filters = {
        ...emptyFilters,
        dateRange: { start: "2024-01-20", end: "" },
      };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((c) => {
        expect(new Date(c.date!).getTime()).toBeGreaterThanOrEqual(
          new Date("2024-01-20").getTime()
        );
      });
    });

    it("should filter by date range (end date only)", () => {
      const filters = {
        ...emptyFilters,
        dateRange: { start: "", end: "2024-01-20" },
      };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((c) => {
        const candidateDate = new Date(c.date!);
        const endDate = new Date("2024-01-20");
        endDate.setHours(23, 59, 59, 999);
        expect(candidateDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it("should filter by date range (start and end)", () => {
      const filters = {
        ...emptyFilters,
        dateRange: { start: "2024-01-15", end: "2024-01-25" },
      };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((c) => {
        const candidateDate = new Date(c.date!);
        const startDate = new Date("2024-01-15");
        const endDate = new Date("2024-01-25");
        endDate.setHours(23, 59, 59, 999);
        expect(candidateDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(candidateDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it("should filter by global search (name)", () => {
      const filters = { ...emptyFilters, search: "John" };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((c) => c.name.includes("John"))).toBe(true);
    });

    it("should filter by global search (email)", () => {
      const filters = { ...emptyFilters, search: "jane@example.com" };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("jane@example.com");
    });

    it("should filter by global search (case insensitive)", () => {
      const filters = { ...emptyFilters, search: "JOHN" };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((c) => c.name.toLowerCase().includes("john"))).toBe(true);
    });

    it("should filter by global search across multiple fields", () => {
      const filters = { ...emptyFilters, search: "Oakland" };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((c) => c.location?.includes("Oakland"))).toBe(true);
    });

    it("should combine multiple filters (AND logic)", () => {
      const filters = {
        ...emptyFilters,
        status: ["PENDING"],
        clients: ["Client A"],
        locations: ["Oakland, CA"],
      };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should filter unresolved candidates (showUnresolvedOnly)", () => {
      const result = applyCandidateFilters(mockCandidates, emptyFilters, true);
      expect(result.length).toBeLessThan(4);
      expect(result.every((c) => c.status !== "HIRED" && c.status !== "DENIED")).toBe(true);
    });

    it("should handle candidates without date", () => {
      const candidatesWithoutDate = [
        ...mockCandidates,
        {
          ...mockCandidates[0],
          id: "5",
          date: undefined,
        },
      ];
      const filters = {
        ...emptyFilters,
        dateRange: { start: "2024-01-01", end: "2024-12-31" },
      };
      const result = applyCandidateFilters(candidatesWithoutDate, filters);
      // Candidates without date should be excluded when date filter is active
      expect(result.every((c) => c.date)).toBe(true);
    });

    it("should handle empty search string", () => {
      const filters = { ...emptyFilters, search: "" };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result).toHaveLength(4);
    });

    it("should handle search with no matches", () => {
      const filters = { ...emptyFilters, search: "Nonexistent" };
      const result = applyCandidateFilters(mockCandidates, filters);
      expect(result).toHaveLength(0);
    });
  });
});

