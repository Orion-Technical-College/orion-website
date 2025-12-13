import { SessionUser } from "@/types/auth";
import { ROLES } from "@/lib/permissions";

/**
 * Single helper: withMockAuthSession(user, fn) that wraps NextAuth mocks.
 * Keeps individual tests clean.
 */

/**
 * Mock getServerSession to return a specific user session.
 */
export function mockGetServerSession(user: SessionUser | null) {
  const mockGetServerSession = jest.fn().mockResolvedValue(
    user
      ? {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clientId: user.clientId,
            isInternal: user.isInternal,
            mustChangePassword: user.mustChangePassword,
          },
        }
      : null
  );

  jest.mock("next-auth", () => ({
    getServerSession: mockGetServerSession,
  }));

  return mockGetServerSession;
}

/**
 * Mock requireAuth to return a specific user.
 */
export function mockRequireAuth(user: SessionUser) {
  const mockRequireAuth = jest.fn().mockResolvedValue(user);

  jest.mock("@/lib/auth", () => ({
    ...jest.requireActual("@/lib/auth"),
    requireAuth: mockRequireAuth,
  }));

  return mockRequireAuth;
}

/**
 * Single helper that wraps NextAuth mocks for a test.
 * Usage:
 * ```ts
 * await withMockAuthSession(testUser, async () => {
 *   // Your test code here
 *   const user = await getCurrentUser();
 *   expect(user).toEqual(testUser);
 * });
 * ```
 */
export async function withMockAuthSession<T>(
  user: SessionUser,
  fn: () => Promise<T> | T
): Promise<T> {
  // Mock getServerSession
  const originalGetServerSession = require("next-auth").getServerSession;
  const mockGetServerSession = jest.fn().mockResolvedValue({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.clientId,
      isInternal: user.isInternal,
      mustChangePassword: user.mustChangePassword,
    },
  });

  jest.spyOn(require("next-auth"), "getServerSession").mockImplementation(mockGetServerSession);

  try {
    return await fn();
  } finally {
    // Restore original
    jest.restoreAllMocks();
  }
}

/**
 * Create a test user with default values.
 */
export function createTestUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: ROLES.RECRUITER,
    clientId: null,
    isInternal: true,
    mustChangePassword: false,
    ...overrides,
  };
}

