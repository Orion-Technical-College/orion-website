/**
 * @jest-environment jsdom
 */

/**
 * React Testing Library tests for filtering UI.
 * Tests that the DataTable component correctly applies filters and displays filtered results.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DataTable } from "@/components/workspace/data-table";
import type { Candidate } from "@/types";
import { makeCandidate } from "../fixtures/candidates";

// Mock NextAuth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        role: "RECRUITER",
        clientId: null,
        isInternal: true,
        mustChangePassword: false,
      },
    },
    status: "authenticated",
  })),
}));

describe("Filtering UI", () => {
  const mockCandidates: Candidate[] = [
    makeCandidate({
      id: "1",
      name: "Alice Smith",
      email: "alice@example.com",
      status: "pending",
      client: "Client A",
      source: "LinkedIn",
      location: "New York, NY",
      date: "2023-01-15",
      jobTitle: "Software Engineer",
    }),
    makeCandidate({
      id: "2",
      name: "Bob Johnson",
      email: "bob@example.com",
      status: "interviewed",
      client: "Client B",
      source: "Indeed",
      location: "San Francisco, CA",
      date: "2023-02-01",
      jobTitle: "Product Manager",
    }),
    makeCandidate({
      id: "3",
      name: "Charlie Brown",
      email: "charlie@example.com",
      status: "hired",
      client: "Client A",
      source: "Referral",
      location: "New York, NY",
      date: "2023-01-20",
      jobTitle: "UX Designer",
    }),
  ] as Candidate[];

  it("should render all candidates initially", () => {
    render(<DataTable data={mockCandidates} />);
    
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
  });

  it("should filter by status when status filter is applied", async () => {
    render(<DataTable data={mockCandidates} />);
    
    // Find and click the status filter (this would need to be implemented based on actual UI)
    // For now, this is a placeholder test structure
    // TODO: Implement actual filter UI interaction when filter panel is fully integrated
    
    await waitFor(() => {
      // Assertions would go here
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });
  });

  it("should filter by search term", async () => {
    render(<DataTable data={mockCandidates} />);
    
    // Find search input and type
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Alice" } });
    
    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.queryByText("Bob Johnson")).not.toBeInTheDocument();
    });
  });

  it("should show unresolved only when toggle is enabled", async () => {
    render(<DataTable data={mockCandidates} showUnresolvedOnly={true} />);
    
    // Should only show pending and interviewed, not hired
    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      expect(screen.queryByText("Charlie Brown")).not.toBeInTheDocument();
    });
  });

  // TODO: Add more tests for:
  // - Client filter
  // - Source filter
  // - Location filter
  // - Date range filter
  // - Combined filters
  // - Performance with large datasets (100+ candidates)
});

