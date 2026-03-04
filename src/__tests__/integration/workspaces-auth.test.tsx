/**
 * @jest-environment jsdom
 *
 * Integration tests for workspaces page auth/redirect behavior.
 * Verifies that redirect to login only happens when session is resolved as unauthenticated,
 * and that authenticated or loading states do not trigger redirect.
 */

import React from "react";
import { render } from "@testing-library/react";
import WorkspacesPage from "@/app/workspaces/page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
}));

const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: jest.fn(),
}));

describe("Workspaces page auth redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("does not redirect to login when status is loading", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
    });
    render(<WorkspacesPage />);
    expect(mockPush).not.toHaveBeenCalledWith("/login");
  });

  it("does not redirect to login when status is authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          role: "PLATFORM_ADMIN",
          clientId: null,
        },
      },
      status: "authenticated",
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ workspaces: [] }),
    });
    render(<WorkspacesPage />);
    await Promise.resolve();
    expect(mockPush).not.toHaveBeenCalledWith("/login");
  });

  it("does not redirect on initial unauthenticated before loading", () => {
    jest.useFakeTimers();
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(<WorkspacesPage />);
    jest.advanceTimersByTime(1000);
    expect(mockPush).not.toHaveBeenCalledWith("/login");
    jest.useRealTimers();
  });

  it("redirects to login when status goes from loading to unauthenticated", () => {
    jest.useFakeTimers();
    mockUseSession
      .mockReturnValueOnce({ data: null, status: "loading" })
      .mockReturnValue({ data: null, status: "unauthenticated" });
    const { rerender } = render(<WorkspacesPage />);
    rerender(<WorkspacesPage />);
    expect(mockPush).not.toHaveBeenCalledWith("/login");
    jest.advanceTimersByTime(500);
    expect(mockPush).toHaveBeenCalledWith("/login");
    jest.useRealTimers();
  });
});
