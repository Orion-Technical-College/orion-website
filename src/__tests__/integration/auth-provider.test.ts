/**
 * @jest-environment node
 */

import {
  authorizeCredentials,
  jwtCallback,
  sessionCallback,
} from "@/lib/auth-provider";
import { testPrisma } from "@/__tests__/setup/db";
import { ROLES } from "@/lib/permissions";
import bcrypt from "bcrypt";
import { makeUser } from "@/__tests__/fixtures/users";
import { cleanDatabase } from "@/__tests__/setup/teardown";

// Mock rate limiting and audit to avoid side effects in tests
jest.mock("@/lib/rate-limit-db", () => ({
  checkRateLimit: jest.fn(() => Promise.resolve({ allowed: true, remaining: 4, resetAt: Date.now() + 900000 })),
  clearRateLimit: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/lib/audit", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/auth-metrics", () => ({
  recordSuccessfulLogin: jest.fn(),
  recordFailedLogin: jest.fn(),
}));

jest.mock("@/lib/auth-logger", () => ({
  logLoginSuccess: jest.fn(),
  logLoginFailure: jest.fn(),
  logRateLimitExceeded: jest.fn(),
  logDatabaseError: jest.fn(),
  logSystemError: jest.fn(),
}));

describe("auth-provider integration", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("authorizeCredentials", () => {
    it("should return user for valid credentials", async () => {
      const password = "TestPassword123!";
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          passwordHash,
          isActive: true,
          role: ROLES.RECRUITER,
        }),
      });

      const result = await authorizeCredentials(
        {
          email: "test@example.com",
          password,
          ip: "127.0.0.1",
        },
        testPrisma
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe(user.id);
      expect(result?.email).toBe(user.email);
      expect(result?.role).toBe(ROLES.RECRUITER);
    });

    it("should return null for invalid email", async () => {
      const result = await authorizeCredentials(
        {
          email: "nonexistent@example.com",
          password: "TestPassword123!",
          ip: "127.0.0.1",
        },
        testPrisma
      );

      expect(result).toBeNull();
    });

    it("should return null for invalid password", async () => {
      const passwordHash = await bcrypt.hash("CorrectPassword123!", 10);
      await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          passwordHash,
          isActive: true,
        }),
      });

      const result = await authorizeCredentials(
        {
          email: "test@example.com",
          password: "WrongPassword123!",
          ip: "127.0.0.1",
        },
        testPrisma
      );

      expect(result).toBeNull();
    });

    it("should return null for inactive user", async () => {
      const password = "TestPassword123!";
      const passwordHash = await bcrypt.hash(password, 10);
      await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          passwordHash,
          isActive: false, // Inactive
        }),
      });

      const result = await authorizeCredentials(
        {
          email: "test@example.com",
          password,
          ip: "127.0.0.1",
        },
        testPrisma
      );

      expect(result).toBeNull();
    });

    it("should include mustChangePassword flag", async () => {
      const password = "TestPassword123!";
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          passwordHash,
          isActive: true,
          mustChangePassword: true,
        }),
      });

      const result = await authorizeCredentials(
        {
          email: "test@example.com",
          password,
          ip: "127.0.0.1",
        },
        testPrisma
      );

      expect(result?.mustChangePassword).toBe(true);
    });
  });

  describe("jwtCallback", () => {
    it("should include all user fields in token", () => {
      const user = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: ROLES.RECRUITER,
        clientId: null,
        isInternal: true,
        mustChangePassword: false,
      };

      const token = jwtCallback({
        token: {},
        user: user as any,
        account: { provider: "credentials" },
      });

      expect(token.id).toBe(user.id);
      expect(token.email).toBe(user.email);
      expect(token.name).toBe(user.name);
      expect(token.role).toBe(user.role);
      expect(token.clientId).toBe(user.clientId);
      expect(token.isInternal).toBe(user.isInternal);
      expect(token.mustChangePassword).toBe(user.mustChangePassword);
      expect(token.authProvider).toBe("credentials");
      expect(token.authProviderId).toBe(user.id);
    });

    it("should map Azure AD B2C provider identity", () => {
      const user = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
        isInternal: false,
      };

      const token = jwtCallback({
        token: {},
        user: user as any,
        account: { provider: "azure-ad-b2c" },
        profile: { sub: "azure-oid-123" },
      });

      expect(token.authProvider).toBe("azureadb2c");
      expect(token.authProviderId).toBe("azure-oid-123");
    });

    it("should preserve token fields when user is not provided", () => {
      const existingToken = {
        id: "user-1",
        email: "test@example.com",
        role: ROLES.RECRUITER,
      };

      const token = jwtCallback({
        token: existingToken,
      });

      expect(token).toEqual(existingToken);
    });
  });

  describe("sessionCallback", () => {
    it("should include all user fields in session", () => {
      const token = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: ROLES.RECRUITER,
        clientId: null,
        isInternal: true,
        mustChangePassword: false,
      };

      const session = sessionCallback({
        session: {
          user: {
            id: "",
            email: "",
            name: "",
            role: ROLES.RECRUITER,
            clientId: null,
            isInternal: false,
          },
        },
        token,
      });

      expect(session.user.id).toBe(token.id);
      expect(session.user.email).toBe(token.email);
      expect(session.user.name).toBe(token.name);
      expect(session.user.role).toBe(token.role);
      expect(session.user.clientId).toBe(token.clientId);
      expect(session.user.isInternal).toBe(token.isInternal);
      expect(session.user.mustChangePassword).toBe(token.mustChangePassword);
    });

    it("should handle null clientId", () => {
      const token = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: ROLES.PLATFORM_ADMIN,
        clientId: null,
        isInternal: true,
      };

      const session = sessionCallback({
        session: {
          user: {
            id: "",
            email: "",
            name: "",
            role: ROLES.PLATFORM_ADMIN,
            clientId: null,
            isInternal: false,
          },
        },
        token,
      });

      expect(session.user.clientId).toBeNull();
    });

    it("should propagate mustChangePassword flag", () => {
      const token = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: ROLES.RECRUITER,
        clientId: null,
        isInternal: true,
        mustChangePassword: true,
      };

      const session = sessionCallback({
        session: {
          user: {
            id: "",
            email: "",
            name: "",
            role: ROLES.RECRUITER,
            clientId: null,
            isInternal: false,
          },
        },
        token,
      });

      expect(session.user.mustChangePassword).toBe(true);
    });
  });
});

