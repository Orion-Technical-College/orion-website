/**
 * @jest-environment node
 */

import {
  requireRole,
  requireAnyRole,
  requirePermission,
  canManageUser,
  canAccessClient,
} from "@/lib/auth";
import { ROLES, PERMISSIONS } from "@/lib/permissions";
import { SessionUser } from "@/types/auth";
import { createTestUser } from "@/__tests__/utils/mock-auth";

describe("auth", () => {
  describe("requireRole", () => {
    it("should not throw when user has correct role", () => {
      const user = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      expect(() => requireRole(user, ROLES.PLATFORM_ADMIN)).not.toThrow();
    });

    it("should throw when user does not have correct role", () => {
      const user = createTestUser({ role: ROLES.RECRUITER });
      expect(() => requireRole(user, ROLES.PLATFORM_ADMIN)).toThrow(
        "Role PLATFORM_ADMIN required"
      );
    });

    it("should throw well-known error object", () => {
      const user = createTestUser({ role: ROLES.RECRUITER });
      try {
        requireRole(user, ROLES.PLATFORM_ADMIN);
        fail("Should have thrown");
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Role PLATFORM_ADMIN required");
      }
    });
  });

  describe("requireAnyRole", () => {
    it("should not throw when user has one of the required roles", () => {
      const user = createTestUser({ role: ROLES.RECRUITER });
      expect(() =>
        requireAnyRole(user, [ROLES.PLATFORM_ADMIN, ROLES.RECRUITER])
      ).not.toThrow();
    });

    it("should throw when user does not have any of the required roles", () => {
      const user = createTestUser({ role: ROLES.CLIENT_USER });
      expect(() =>
        requireAnyRole(user, [ROLES.PLATFORM_ADMIN, ROLES.RECRUITER])
      ).toThrow("One of roles PLATFORM_ADMIN, RECRUITER required");
    });
  });

  describe("requirePermission", () => {
    it("should not throw when user has permission", () => {
      const user = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      expect(() =>
        requirePermission(user, PERMISSIONS.MANAGE_PLATFORM_USERS)
      ).not.toThrow();
    });

    it("should throw when user does not have permission", () => {
      const user = createTestUser({ role: ROLES.CLIENT_USER });
      expect(() =>
        requirePermission(user, PERMISSIONS.MANAGE_PLATFORM_USERS)
      ).toThrow("Permission MANAGE_PLATFORM_USERS required");
    });

    it("should throw well-known error object", () => {
      const user = createTestUser({ role: ROLES.CLIENT_USER });
      try {
        requirePermission(user, PERMISSIONS.MANAGE_PLATFORM_USERS);
        fail("Should have thrown");
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Permission MANAGE_PLATFORM_USERS required");
      }
    });
  });

  describe("canManageUser", () => {
    it("should return true when Platform Admin manages any user", () => {
      const platformAdmin = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      const targetUser = createTestUser({ role: ROLES.RECRUITER });
      expect(canManageUser(targetUser, platformAdmin)).toBe(true);
    });

    it("should return true when Platform Admin manages another Platform Admin", () => {
      const platformAdmin = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      const targetUser = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      expect(canManageUser(targetUser, platformAdmin)).toBe(true);
    });

    it("should return true when Client Admin manages Client User in same client", () => {
      const clientAdmin = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      const targetUser = createTestUser({
        role: ROLES.CLIENT_USER,
        clientId: "client-1",
      });
      expect(canManageUser(targetUser, clientAdmin)).toBe(true);
    });

    it("should return false when Client Admin tries to manage Client User in different client", () => {
      const clientAdmin = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      const targetUser = createTestUser({
        role: ROLES.CLIENT_USER,
        clientId: "client-2",
      });
      expect(canManageUser(targetUser, clientAdmin)).toBe(false);
    });

    it("should return false when Client Admin tries to manage Client Admin", () => {
      const clientAdmin = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      const targetUser = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      expect(canManageUser(targetUser, clientAdmin)).toBe(false);
    });

    it("should return false when Recruiter tries to manage any user", () => {
      const recruiter = createTestUser({ role: ROLES.RECRUITER });
      const targetUser = createTestUser({ role: ROLES.CLIENT_USER });
      expect(canManageUser(targetUser, recruiter)).toBe(false);
    });

    it("should return false when Client User tries to manage any user", () => {
      const clientUser = createTestUser({ role: ROLES.CLIENT_USER });
      const targetUser = createTestUser({ role: ROLES.CLIENT_USER });
      expect(canManageUser(targetUser, clientUser)).toBe(false);
    });
  });

  describe("canAccessClient", () => {
    it("should return true when Platform Admin accesses any client", () => {
      const platformAdmin = createTestUser({ role: ROLES.PLATFORM_ADMIN });
      expect(canAccessClient("client-1", platformAdmin)).toBe(true);
      expect(canAccessClient(null, platformAdmin)).toBe(true);
    });

    it("should return true when Recruiter accesses any client", () => {
      const recruiter = createTestUser({ role: ROLES.RECRUITER });
      expect(canAccessClient("client-1", recruiter)).toBe(true);
      expect(canAccessClient(null, recruiter)).toBe(true);
    });

    it("should return true when Client Admin accesses their own client", () => {
      const clientAdmin = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      expect(canAccessClient("client-1", clientAdmin)).toBe(true);
    });

    it("should return false when Client Admin accesses different client", () => {
      const clientAdmin = createTestUser({
        role: ROLES.CLIENT_ADMIN,
        clientId: "client-1",
      });
      expect(canAccessClient("client-2", clientAdmin)).toBe(false);
    });

    it("should return true when Client User accesses their own client", () => {
      const clientUser = createTestUser({
        role: ROLES.CLIENT_USER,
        clientId: "client-1",
      });
      expect(canAccessClient("client-1", clientUser)).toBe(true);
    });

    it("should return false when Client User accesses different client", () => {
      const clientUser = createTestUser({
        role: ROLES.CLIENT_USER,
        clientId: "client-1",
      });
      expect(canAccessClient("client-2", clientUser)).toBe(false);
    });
  });
});

