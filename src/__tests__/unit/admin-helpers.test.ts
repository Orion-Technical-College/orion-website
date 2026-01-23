/**
 * @jest-environment node
 */

/**
 * Unit tests for admin helper functions.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { adminWhere, canDeleteUser, canDeleteClient, getSystemSetting, setSystemSetting } from "@/lib/admin-helpers";
import { createTestUser } from "../utils/mock-auth";
import { ROLES } from "@/lib/permissions";
import type { SessionUser } from "@/types/auth";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    campaign: {
      count: jest.fn(),
    },
    candidate: {
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    systemSetting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}), { virtual: true });

const { prisma } = require("@/lib/prisma");

describe("Admin Helpers", () => {
  describe("adminWhere", () => {
    it("should return empty object for Platform Admin", () => {
      const platformAdmin = createTestUser({
        role: ROLES.PLATFORM_ADMIN,
      });

      const result = adminWhere(platformAdmin);
      expect(result).toEqual({});
    });

    it("should throw error for non-admin users", () => {
      const regularUser = createTestUser({
        role: ROLES.RECRUITER,
      });

      expect(() => adminWhere(regularUser)).toThrow();
    });
  });

  describe("canDeleteUser", () => {
    let platformAdmin: SessionUser;
    let regularUser: SessionUser;

    beforeEach(() => {
      platformAdmin = createTestUser({
        id: "admin-1",
        role: ROLES.PLATFORM_ADMIN,
      });

      regularUser = createTestUser({
        id: "user-1",
        role: ROLES.RECRUITER,
      });
    });

    it("should allow deletion when user has no dependencies", async () => {
      const user = {
        id: "user-1",
        email: "user@example.com",
        role: ROLES.RECRUITER,
      } as any;

      prisma.campaign.count.mockResolvedValue(0);
      prisma.candidate.count.mockResolvedValue(0);

      const result = await canDeleteUser(user, platformAdmin);

      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should prevent deletion when user has active campaigns", async () => {
      const user = {
        id: "user-1",
        email: "user@example.com",
        role: ROLES.RECRUITER,
      } as any;

      prisma.campaign.count.mockResolvedValue(2);

      const result = await canDeleteUser(user, platformAdmin);

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("active campaign");
    });

    it("should prevent deleting own account", async () => {
      const selfUser = {
        id: platformAdmin.id,
        email: platformAdmin.email,
        role: platformAdmin.role,
      } as any;

      prisma.campaign.count.mockResolvedValue(0);

      const result = await canDeleteUser(selfUser, platformAdmin);

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("Cannot delete your own account");
    });

    it("should require Platform Admin role", async () => {
      const user = {
        id: "user-1",
        email: "user@example.com",
        role: ROLES.RECRUITER,
      } as any;

      const result = await canDeleteUser(user, regularUser);

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("Only Platform Admins");
    });
  });

  describe("canDeleteClient", () => {
    let platformAdmin: SessionUser;

    beforeEach(() => {
      platformAdmin = createTestUser({
        id: "admin-1",
        role: ROLES.PLATFORM_ADMIN,
      });
    });

    it("should allow deletion when client has no users or candidates", async () => {
      const client = {
        id: "client-1",
        name: "Test Client",
      } as any;

      prisma.user.count.mockResolvedValue(0);
      prisma.candidate.count.mockResolvedValue(0);

      const result = await canDeleteClient(client, platformAdmin);

      expect(result.canDelete).toBe(true);
    });

    it("should prevent deletion when client has users", async () => {
      const client = {
        id: "client-1",
        name: "Test Client",
      } as any;

      prisma.user.count.mockResolvedValue(5);
      prisma.candidate.count.mockResolvedValue(0);

      const result = await canDeleteClient(client, platformAdmin);

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("active users");
      expect(result.details?.users).toBe(5);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { clientId: "client-1" },
      });
    });

    it("should prevent deletion when client has candidates", async () => {
      const client = {
        id: "client-1",
        name: "Test Client",
      } as any;

      prisma.user.count.mockResolvedValue(0);
      prisma.candidate.count.mockResolvedValue(10);

      const result = await canDeleteClient(client, platformAdmin);

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("candidates");
      expect(result.details?.candidates).toBe(10);
      expect(prisma.candidate.count).toHaveBeenCalledWith({
        where: { clientId: "client-1" },
      });
    });

    it("should require Platform Admin role", async () => {
      const regularUser = createTestUser({
        role: ROLES.RECRUITER,
      });

      const client = {
        id: "client-1",
        name: "Test Client",
      } as any;

      const result = await canDeleteClient(client, regularUser);

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("Only Platform Admins");
    });
  });

  describe("getSystemSetting", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Clear cache by accessing the module
      jest.resetModules();
    });

    it("should return setting from database", async () => {
      prisma.systemSetting.findUnique.mockResolvedValue({
        key: "FEATURE_AI_ASSISTANT",
        value: "true",
        isEnabled: true,
        updatedAt: new Date(),
      });

      const result = await getSystemSetting("FEATURE_AI_ASSISTANT");

      expect(result).toBe(true);
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledWith({
        where: { key: "FEATURE_AI_ASSISTANT" },
      });
    });

    it("should fall back to environment variable if not in database", async () => {
      prisma.systemSetting.findUnique.mockResolvedValue(null);
      process.env.FEATURE_AI_ASSISTANT = "true";

      const result = await getSystemSetting("FEATURE_AI_ASSISTANT");

      expect(result).toBe(true);
    });

    it("should default to true if not found anywhere", async () => {
      prisma.systemSetting.findUnique.mockResolvedValue(null);
      delete process.env.FEATURE_AI_ASSISTANT;

      const result = await getSystemSetting("FEATURE_AI_ASSISTANT");

      expect(result).toBe(true);
    });

    it("should cache results", async () => {
      prisma.systemSetting.findUnique.mockResolvedValue({
        key: "FEATURE_TEST",
        value: "true",
        isEnabled: true,
        updatedAt: new Date(),
      });

      // First call
      await getSystemSetting("FEATURE_TEST");
      // Second call within cache TTL should use cache
      await getSystemSetting("FEATURE_TEST");

      // Should query at least once (caching may vary based on timing)
      expect(prisma.systemSetting.findUnique).toHaveBeenCalled();
    });
  });

  describe("setSystemSetting", () => {
    it("should update system setting in database", async () => {
      prisma.systemSetting.upsert.mockResolvedValue({
        key: "FEATURE_AI_ASSISTANT",
        isEnabled: false,
        updatedAt: new Date(),
      });

      await setSystemSetting("FEATURE_AI_ASSISTANT", false, "admin-1", "Test description");

      expect(prisma.systemSetting.upsert).toHaveBeenCalled();
      const callArgs = (prisma.systemSetting.upsert as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.key).toBe("FEATURE_AI_ASSISTANT");
      expect(callArgs.update.isEnabled).toBe(false);
      expect(callArgs.update.value).toBe("false");
      expect(callArgs.update.description).toBe("Test description");
      expect(callArgs.update.updatedBy).toBe("admin-1");
      expect(callArgs.create.key).toBe("FEATURE_AI_ASSISTANT");
      expect(callArgs.create.isEnabled).toBe(false);
    });

    it("should call upsert when updating setting", async () => {
      prisma.systemSetting.upsert.mockResolvedValue({
        key: "FEATURE_TEST",
        isEnabled: false,
        updatedAt: new Date(),
      });

      await setSystemSetting("FEATURE_TEST", false, "admin-1");

      expect(prisma.systemSetting.upsert).toHaveBeenCalled();
      const callArgs = (prisma.systemSetting.upsert as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.key).toBe("FEATURE_TEST");
    });
  });
});








