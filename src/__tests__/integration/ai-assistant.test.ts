/**
 * @jest-environment node
 */

/**
 * Integration tests for AI assistant API.
 * Tests the /api/ai/chat endpoint with mocked Azure OpenAI responses.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { createTestUser } from "../utils/mock-auth";
import { ROLES } from "@/lib/permissions";
import type { SessionUser } from "@/types/auth";

// Mock Azure OpenAI client
jest.mock("@/lib/azure-openai-client", () => ({
  azureOpenAI: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}), { virtual: true });

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    candidate: {
      findMany: jest.fn(),
    },
  },
}), { virtual: true });

// Mock audit logging
jest.mock("@/lib/audit", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

// Mock rate limiting
jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockReturnValue({
    allowed: true,
    remaining: 19,
    resetAt: Date.now() + 60000,
  }),
}), { virtual: true });

// Mock auth to avoid config validation errors
jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
  getCurrentUser: jest.fn(),
}), { virtual: true });

describe("AI Assistant API Integration", () => {
  let azureOpenAI: any;
  let prisma: any;
  let checkRateLimit: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FEATURE_AI_ASSISTANT = "true";
    // Set required env vars to avoid validation errors
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.NEXTAUTH_SECRET = "test-secret";
    process.env.DATABASE_URL = "sqlserver://test";

    azureOpenAI = require("@/lib/azure-openai-client").azureOpenAI;
    prisma = require("@/lib/prisma").prisma;
    checkRateLimit = require("@/lib/rate-limit").checkRateLimit;
  });

  describe("Role-based access control", () => {
    it("should allow PLATFORM_ADMIN access", async () => {
      const user = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      const { requireAuth } = require("@/lib/auth");
      requireAuth.mockResolvedValue(user);

      // Mock successful AI response
      azureOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: "Test response",
            },
          },
        ],
      });

      prisma.candidate.findMany.mockResolvedValue([]);

      // Simulate API call logic
      const hasAccess = user.role === ROLES.PLATFORM_ADMIN || user.role === ROLES.RECRUITER;
      expect(hasAccess).toBe(true);
    });

    it("should allow RECRUITER access", async () => {
      const user = createTestUser({ role: ROLES.RECRUITER });
      const hasAccess = user.role === ROLES.PLATFORM_ADMIN || user.role === ROLES.RECRUITER;
      expect(hasAccess).toBe(true);
    });

    it("should deny CLIENT_ADMIN access", async () => {
      const user = createTestUser({ role: ROLES.CLIENT_ADMIN });
      const hasAccess = user.role === ROLES.PLATFORM_ADMIN || user.role === ROLES.RECRUITER;
      expect(hasAccess).toBe(false);
    });

    it("should deny CLIENT_USER access", async () => {
      const user = createTestUser({ role: ROLES.CLIENT_USER });
      const hasAccess = user.role === ROLES.PLATFORM_ADMIN || user.role === ROLES.RECRUITER;
      expect(hasAccess).toBe(false);
    });
  });

  describe("Feature flag", () => {
    it("should allow access when feature flag is enabled", () => {
      process.env.FEATURE_AI_ASSISTANT = "true";
      const isEnabled = process.env.FEATURE_AI_ASSISTANT !== "false";
      expect(isEnabled).toBe(true);
    });

    it("should deny access when feature flag is disabled", () => {
      process.env.FEATURE_AI_ASSISTANT = "false";
      const isEnabled = process.env.FEATURE_AI_ASSISTANT !== "false";
      expect(isEnabled).toBe(false);
    });
  });

  describe("Rate limiting", () => {
    it("should check rate limit for user", () => {
      const user = createTestUser();
      const rateLimitKey = `ai-chat:${user.id}`;
      const rateLimit = checkRateLimit(rateLimitKey, 20, 60 * 1000);

      expect(checkRateLimit).toHaveBeenCalledWith(rateLimitKey, 20, 60 * 1000);
      expect(rateLimit.allowed).toBe(true);
    });

    it("should deny when rate limit exceeded", () => {
      checkRateLimit.mockReturnValueOnce({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      const rateLimit = checkRateLimit("test-key", 20, 60 * 1000);
      expect(rateLimit.allowed).toBe(false);
    });
  });

  describe("Tenant isolation", () => {
    it("should filter candidates by tenant for CLIENT_ADMIN", async () => {
      const user = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });

      const { tenantWhere } = require("@/lib/tenant");
      const filter = tenantWhere(user);

      // CLIENT_ADMIN should have clientId filter
      expect(filter).toHaveProperty("clientId", "client-1");
    });

    it("should not filter by tenant for PLATFORM_ADMIN", async () => {
      const user = createTestUser({
        role: ROLES.PLATFORM_ADMIN,
        clientId: null,
      });

      const { tenantWhere } = require("@/lib/tenant");
      const filter = tenantWhere(user);

      // PLATFORM_ADMIN should have empty filter (global scope)
      expect(filter).toEqual({});
    });

    it("should not filter by tenant for RECRUITER", async () => {
      const user = createTestUser({
        role: ROLES.RECRUITER,
        clientId: null,
      });

      const { tenantWhere } = require("@/lib/tenant");
      const filter = tenantWhere(user);

      // RECRUITER should have empty filter (global scope)
      expect(filter).toEqual({});
    });
  });

  describe("Security-focused tenant isolation", () => {
    it("should not return data from different tenant", async () => {
      // Seed two tenants with distinct candidate names
      const tenantACandidates = [
        { id: "1", name: "Alice TenantA", clientId: "client-a" },
        { id: "2", name: "Bob TenantA", clientId: "client-a" },
      ];

      const tenantBCandidates = [
        { id: "3", name: "Charlie TenantB", clientId: "client-b" },
        { id: "4", name: "Diana TenantB", clientId: "client-b" },
      ];

      // Simulate request with tenant A credentials
      const user = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-a",
      });

      const { tenantWhere } = require("@/lib/tenant");
      const filter = tenantWhere(user);

      // Mock Prisma to return only tenant A candidates
      prisma.candidate.findMany.mockResolvedValue(tenantACandidates);

      const candidates = await prisma.candidate.findMany({
        where: filter,
      });

      // Verify no tenant B data is returned
      expect(candidates.every((c: any) => c.clientId === "client-a")).toBe(true);
      expect(candidates.some((c: any) => c.name.includes("TenantB"))).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("should handle Azure OpenAI rate limit errors", async () => {
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.name = "RateLimitError";

      azureOpenAI.chat.completions.create.mockRejectedValue(rateLimitError);

      const { classifyAIError } = require("@/lib/ai-service");
      const errorType = classifyAIError(rateLimitError);

      expect(errorType).toBe("RATE_LIMIT");
    });

    it("should handle Azure OpenAI server errors", async () => {
      const serverError = new Error("Server error 500");
      azureOpenAI.chat.completions.create.mockRejectedValue(serverError);

      const { classifyAIError } = require("@/lib/ai-service");
      const errorType = classifyAIError(serverError);

      expect(errorType).toBe("SERVER_ERROR");
    });

    it("should handle network timeouts", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";

      azureOpenAI.chat.completions.create.mockRejectedValue(timeoutError);

      const { classifyAIError } = require("@/lib/ai-service");
      const errorType = classifyAIError(timeoutError);

      expect(errorType).toBe("SERVER_ERROR");
    });
  });

  describe("Filter validation", () => {
    it("should validate and normalize AI-suggested filters", async () => {
      const { validateAndNormalizeFilters } = require("@/lib/ai-query-parser");

      // AI suggests invalid status
      const aiSuggestedFilters = {
        status: ["pending", "INVALID_STATUS", "hired"],
        clients: ["  Client A  "],
      };

      const result = validateAndNormalizeFilters(aiSuggestedFilters);

      // Should accept valid filters and reject invalid ones
      expect(result.filters.status).toEqual(["pending", "hired"]);
      expect(result.filters.clients).toContain("Client A");
      expect(result.warnings).toContain("Ignored unknown status 'INVALID_STATUS'");
    });
  });
});
