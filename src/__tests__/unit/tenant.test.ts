/**
 * @jest-environment node
 */

import { tenantWhere, validateTenantScope, findManyCandidates } from "@/lib/tenant";
import { ROLES } from "@/lib/permissions";
import { SessionUser } from "@/types/auth";
import { createTestUser } from "@/__tests__/utils/mock-auth";
import { prisma } from "@/lib/prisma";

// Mock prisma and audit
jest.mock("@/lib/prisma", () => ({
  prisma: {
    candidate: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/audit", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

describe("tenant", () => {
  describe("tenantWhere", () => {
    it("should return empty object for Platform Admin (global scope)", () => {
      const user = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      const result = tenantWhere(user);
      expect(result).toEqual({});
    });

    it("should return empty object for Recruiter (global scope)", () => {
      const user = createTestUser({ role: ROLES.RECRUITER });
      const result = tenantWhere(user);
      expect(result).toEqual({});
    });

    it("should return clientId filter for Client Admin", () => {
      const user = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      const result = tenantWhere(user);
      expect(result).toEqual({ clientId: "client-1" });
    });

    it("should return clientId filter for Client User", () => {
      const user = createTestUser({
        role: ROLES.CLIENT_USER,
        clientId: "client-1",
      });
      const result = tenantWhere(user);
      expect(result).toEqual({ clientId: "client-1" });
    });

    it("should throw error when tenant-scoped user missing clientId", () => {
      const user = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: null,
      });
      expect(() => tenantWhere(user)).toThrow(
        "Tenant scoped user (CLIENT_ADMIN) missing clientId"
      );
    });

    it("should throw error when Candidate missing clientId", () => {
      const user = createTestUser({
        role: ROLES.CANDIDATE,
        clientId: null,
      });
      expect(() => tenantWhere(user)).toThrow(
        "Tenant scoped user (CANDIDATE) missing clientId"
      );
    });
  });

  describe("validateTenantScope", () => {
    it("should not throw for Platform Admin accessing any client", () => {
      const user = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      expect(() => validateTenantScope(user, "client-1")).not.toThrow();
      expect(() => validateTenantScope(user, null)).not.toThrow();
    });

    it("should not throw for Recruiter accessing any client", () => {
      const user = createTestUser({ role: ROLES.RECRUITER });
      expect(() => validateTenantScope(user, "client-1")).not.toThrow();
    });

    it("should not throw when Client Admin accesses their own client", () => {
      const user = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      expect(() => validateTenantScope(user, "client-1")).not.toThrow();
    });

    it("should throw when Client Admin accesses different client", () => {
      const user = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      expect(() => validateTenantScope(user, "client-2")).toThrow(
        "Access denied: resource belongs to different tenant"
      );
    });

    it("should throw when Client User accesses different client", () => {
      const user = createTestUser({
        role: ROLES.CLIENT_USER,
        clientId: "client-1",
      });
      expect(() => validateTenantScope(user, "client-2")).toThrow(
        "Access denied: resource belongs to different tenant"
      );
    });
  });

  describe("findManyCandidates", () => {
    it("should apply tenant filtering for Client Admin", async () => {
      const user = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      const mockFindMany = prisma.candidate.findMany as jest.Mock;
      mockFindMany.mockResolvedValue([]);

      await findManyCandidates(user, { status: "PENDING" });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          clientId: "client-1",
          status: "PENDING",
        },
      });
    });

    it("should not apply tenant filtering for Platform Admin", async () => {
      const user = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      const mockFindMany = prisma.candidate.findMany as jest.Mock;
      mockFindMany.mockResolvedValue([]);

      await findManyCandidates(user, { status: "PENDING" });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          status: "PENDING",
        },
      });
    });

    it("should not apply tenant filtering for Recruiter", async () => {
      const user = createTestUser({ role: ROLES.RECRUITER });
      const mockFindMany = prisma.candidate.findMany as jest.Mock;
      mockFindMany.mockResolvedValue([]);

      await findManyCandidates(user, { status: "PENDING" });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          status: "PENDING",
        },
      });
    });
  });

  describe("role change simulation", () => {
    it("should return global scope when user transitions from ClientUser to PlatformAdmin", () => {
      // Simulate role change: user was ClientUser, now is PlatformAdmin
      const userBefore = createTestUser({
        role: ROLES.CLIENT_USER,
        clientId: "client-1",
      });
      const userAfter = createTestUser({
        role: ROLES.PLATFORM_ADMIN,
        clientId: "client-1", // clientId still present but not used
      });

      // Before: tenant-scoped
      expect(() => tenantWhere(userBefore)).not.toThrow();
      const beforeResult = tenantWhere(userBefore);
      expect(beforeResult).toEqual({ clientId: "client-1" });

      // After: global scope (catches caching/stale session bugs)
      const afterResult = tenantWhere(userAfter);
      expect(afterResult).toEqual({});
    });
  });
});

