/**
 * @jest-environment node
 */

import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  isValidRole,
  hasPermission,
} from "@/lib/permissions";

describe("permissions", () => {
  describe("ROLES", () => {
    it("should have all expected roles", () => {
      expect(ROLES.PLATFORM_ADMIN).toBe("PLATFORM_ADMIN");
      expect(ROLES.RECRUITER).toBe("RECRUITER");
      expect(ROLES.CLIENT_ADMIN).toBe("CLIENT_ADMIN");
      expect(ROLES.CLIENT_USER).toBe("CLIENT_USER");
      expect(ROLES.CANDIDATE).toBe("CANDIDATE");
    });
  });

  describe("isValidRole", () => {
    it("should return true for valid roles", () => {
      expect(isValidRole("PLATFORM_ADMIN")).toBe(true);
      expect(isValidRole("RECRUITER")).toBe(true);
      expect(isValidRole("CLIENT_ADMIN")).toBe(true);
      expect(isValidRole("CLIENT_USER")).toBe(true);
      expect(isValidRole("CANDIDATE")).toBe(true);
    });

    it("should return false for invalid roles", () => {
      expect(isValidRole("INVALID_ROLE")).toBe(false);
      expect(isValidRole("")).toBe(false);
      expect(isValidRole("admin")).toBe(false);
      expect(isValidRole("PLATFORM_ADMIN ")).toBe(false); // trailing space
    });

    it("should return false for undefined and null", () => {
      expect(isValidRole(undefined as any)).toBe(false);
      expect(isValidRole(null as any)).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("should return true when role has permission", () => {
      expect(
        hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.MANAGE_PLATFORM_USERS)
      ).toBe(true);
      expect(
        hasPermission(ROLES.RECRUITER, PERMISSIONS.MANAGE_CAMPAIGNS)
      ).toBe(true);
      expect(
        hasPermission(ROLES.CLIENT_ADMIN, PERMISSIONS.MANAGE_CLIENT_USERS)
      ).toBe(true);
      expect(
        hasPermission(ROLES.CLIENT_USER, PERMISSIONS.VIEW_CLIENT_CANDIDATES)
      ).toBe(true);
    });

    it("should return false when role does not have permission", () => {
      expect(
        hasPermission(ROLES.RECRUITER, PERMISSIONS.MANAGE_PLATFORM_USERS)
      ).toBe(false);
      expect(
        hasPermission(ROLES.CLIENT_USER, PERMISSIONS.MANAGE_CLIENT_CANDIDATES)
      ).toBe(false);
      expect(
        hasPermission(ROLES.CANDIDATE, PERMISSIONS.VIEW_CLIENT_CANDIDATES)
      ).toBe(false);
    });

    it("should return false for invalid permission", () => {
      expect(hasPermission(ROLES.PLATFORM_ADMIN, "INVALID_PERMISSION")).toBe(
        false
      );
    });
  });

  describe("ROLE_PERMISSIONS mapping", () => {
    it("should have permissions for all roles", () => {
      expect(ROLE_PERMISSIONS[ROLES.PLATFORM_ADMIN]).toBeDefined();
      expect(ROLE_PERMISSIONS[ROLES.RECRUITER]).toBeDefined();
      expect(ROLE_PERMISSIONS[ROLES.CLIENT_ADMIN]).toBeDefined();
      expect(ROLE_PERMISSIONS[ROLES.CLIENT_USER]).toBeDefined();
      expect(ROLE_PERMISSIONS[ROLES.CANDIDATE]).toBeDefined();
    });

    it("should have correct permissions for PLATFORM_ADMIN", () => {
      const permissions = ROLE_PERMISSIONS[ROLES.PLATFORM_ADMIN];
      expect(permissions).toContain(PERMISSIONS.MANAGE_PLATFORM_USERS);
      expect(permissions).toContain(PERMISSIONS.MANAGE_CLIENT_USERS);
      expect(permissions).toContain(PERMISSIONS.MANAGE_CLIENTS);
      expect(permissions).toContain(PERMISSIONS.VIEW_AUDIT_LOGS);
      expect(permissions).toContain(PERMISSIONS.IMPERSONATE_USERS);
    });

    it("should have correct permissions for RECRUITER", () => {
      const permissions = ROLE_PERMISSIONS[ROLES.RECRUITER];
      expect(permissions).toContain(PERMISSIONS.MANAGE_CAMPAIGNS);
      expect(permissions).toContain(PERMISSIONS.VIEW_ALL_CANDIDATES);
      expect(permissions).toContain(PERMISSIONS.MANAGE_CLIENT_CANDIDATES);
      expect(permissions).not.toContain(PERMISSIONS.MANAGE_PLATFORM_USERS);
      expect(permissions).not.toContain(PERMISSIONS.VIEW_AUDIT_LOGS);
    });

    it("should have correct permissions for CLIENT_ADMIN", () => {
      const permissions = ROLE_PERMISSIONS[ROLES.CLIENT_ADMIN];
      expect(permissions).toContain(PERMISSIONS.MANAGE_CLIENT_USERS);
      expect(permissions).toContain(PERMISSIONS.MANAGE_CAMPAIGNS);
      expect(permissions).toContain(PERMISSIONS.VIEW_CLIENT_CANDIDATES);
      expect(permissions).not.toContain(PERMISSIONS.MANAGE_PLATFORM_USERS);
      expect(permissions).not.toContain(PERMISSIONS.VIEW_ALL_CANDIDATES);
    });

    it("should have correct permissions for CLIENT_USER", () => {
      const permissions = ROLE_PERMISSIONS[ROLES.CLIENT_USER];
      expect(permissions).toContain(PERMISSIONS.VIEW_CLIENT_CANDIDATES);
      expect(permissions).not.toContain(PERMISSIONS.MANAGE_CLIENT_CANDIDATES);
      expect(permissions).not.toContain(PERMISSIONS.MANAGE_CAMPAIGNS);
    });

    it("should have no permissions for CANDIDATE", () => {
      const permissions = ROLE_PERMISSIONS[ROLES.CANDIDATE];
      expect(permissions).toEqual([]);
    });

    // Future role guard: Ensure adding new roles requires updating permission matrix
    it("should fail if new role is added without updating ROLE_PERMISSIONS", () => {
      const allRoles = Object.values(ROLES);
      const allRolesInMapping = Object.keys(ROLE_PERMISSIONS);
      expect(allRolesInMapping).toHaveLength(allRoles.length);
      allRoles.forEach((role) => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
      });
    });
  });

  describe("negative tests", () => {
    it("should handle edge cases gracefully", () => {
      expect(hasPermission("" as any, PERMISSIONS.MANAGE_PLATFORM_USERS)).toBe(
        false
      );
      expect(
        hasPermission(ROLES.PLATFORM_ADMIN, "" as any)
      ).toBe(false);
    });
  });
});

