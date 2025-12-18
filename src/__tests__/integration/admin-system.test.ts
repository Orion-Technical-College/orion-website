/**
 * @jest-environment node
 */

/**
 * Integration tests for Admin System Settings API routes.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { createTestUser } from "../utils/mock-auth";
import { ROLES } from "@/lib/permissions";
import type { SessionUser } from "@/types/auth";
import { GET as ConfigGET } from "@/app/api/admin/system/config/route";
import { GET as HealthGET } from "@/app/api/admin/system/health/route";
import { PATCH } from "@/app/api/admin/system/feature-flags/[key]/route";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    systemSetting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}), { virtual: true });

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}), { virtual: true });

jest.mock("@/lib/audit", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

jest.mock("@/lib/admin-helpers", () => ({
  getSystemSetting: jest.fn(),
  setSystemSetting: jest.fn(),
}), { virtual: true });

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}), { virtual: true });

const { prisma } = require("@/lib/prisma");
const { requireAuth, requireRole } = require("@/lib/auth");
const { getSystemSetting } = require("@/lib/admin-helpers");

describe("Admin System Settings API", () => {
  let platformAdmin: SessionUser;

  beforeEach(() => {
    jest.clearAllMocks();

    platformAdmin = createTestUser({
      id: "admin-1",
      email: "admin@test.com",
      name: "Platform Admin",
      role: ROLES.PLATFORM_ADMIN,
      isInternal: true,
    });

    requireAuth.mockResolvedValue(platformAdmin);
    requireRole.mockImplementation((user: SessionUser, role: string) => {
      if (user.role !== role) {
        throw new Error("Forbidden");
      }
    });
  });

  describe("GET /api/admin/system/config", () => {
    it("should return system configuration", async () => {
      const mockFeatureFlags = [
        {
          id: "flag-1",
          key: "FEATURE_AI_ASSISTANT",
          value: "true",
          isEnabled: true,
          description: "AI Assistant feature",
          updatedBy: "admin-1",
          updatedAt: new Date(),
          createdAt: new Date(),
        },
      ];

      const mockUpdaters = [
        {
          id: "admin-1",
          name: "Platform Admin",
        },
      ];

      prisma.systemSetting.findMany.mockResolvedValue(mockFeatureFlags);
      prisma.user.findMany.mockResolvedValue(mockUpdaters);
      getSystemSetting.mockResolvedValue(true);

      // Mock environment variables
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4o";
      process.env.NODE_ENV = "development";

      const request = new NextRequest("http://localhost/api/admin/system/config");
      const response = await ConfigGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.featureFlags).toHaveLength(1);
      expect(data.data.azureOpenAI).toBeDefined();
      expect(data.data.azureOpenAI.deploymentName).toContain("***"); // Masked
      expect(data.data.environment).toBe("development");
    });

    it("should mask deployment name", async () => {
      prisma.systemSetting.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      getSystemSetting.mockResolvedValue(true);

      process.env.AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4o-long-name";

      const request = new NextRequest("http://localhost/api/admin/system/config");
      const response = await ConfigGET(request);
      const data = await response.json();

      expect(data.data.azureOpenAI.deploymentName).toContain("***");
      expect(data.data.azureOpenAI.deploymentName).not.toContain("gpt-4o-long-name");
    });
  });

  describe("GET /api/admin/system/health", () => {
    it("should return healthy status when all systems are up", async () => {
      prisma.$queryRaw.mockResolvedValue([{ "": 1 }]);

      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4o";

      const request = new NextRequest("http://localhost/api/admin/system/health");
      const response = await HealthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.overall).toBe("healthy");
      expect(data.data.database.status).toBe("healthy");
      expect(data.data.azureOpenAI.status).toBe("healthy");
    });

    it("should return degraded status when database is slow", async () => {
      // Mock slow database query
      prisma.$queryRaw.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([{ "": 1 }]), 1500))
      );

      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4o";

      const request = new NextRequest("http://localhost/api/admin/system/health");
      const response = await HealthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.database.status).toBe("degraded");
      expect(data.data.database.latency).toBeGreaterThan(1000);
    });

    it("should return down status when database fails", async () => {
      prisma.$queryRaw.mockRejectedValue(new Error("Connection failed"));

      const request = new NextRequest("http://localhost/api/admin/system/health");
      const response = await HealthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.database.status).toBe("down");
    });

    it("should return degraded status when Azure OpenAI config is missing", async () => {
      prisma.$queryRaw.mockResolvedValue([{ "": 1 }]);

      delete process.env.AZURE_OPENAI_ENDPOINT;
      delete process.env.AZURE_OPENAI_API_KEY;

      const request = new NextRequest("http://localhost/api/admin/system/health");
      const response = await HealthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.azureOpenAI.status).toBe("degraded");
    });
  });

  describe("PATCH /api/admin/system/feature-flags/[key]", () => {
    it("should toggle feature flag", async () => {
      const { setSystemSetting } = require("@/lib/admin-helpers");
      setSystemSetting.mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost/api/admin/system/feature-flags/FEATURE_AI_ASSISTANT", {
        method: "PATCH",
        body: JSON.stringify({
          isEnabled: false,
        }),
      });

      const response = await PATCH(request, { params: { key: "FEATURE_AI_ASSISTANT" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(setSystemSetting).toHaveBeenCalledWith(
        "FEATURE_AI_ASSISTANT",
        false,
        platformAdmin.id,
        undefined
      );
    });

    it("should validate isEnabled is boolean", async () => {
      const request = new NextRequest("http://localhost/api/admin/system/feature-flags/FEATURE_AI_ASSISTANT", {
        method: "PATCH",
        body: JSON.stringify({
          isEnabled: "not-a-boolean",
        }),
      });

      const response = await PATCH(request, { params: { key: "FEATURE_AI_ASSISTANT" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("boolean");
    });
  });
});




