/**
 * @jest-environment node
 */

/**
 * Integration tests for Admin User Management API routes.
 * Tests CRUD operations, validation, and authorization.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { createTestUser } from "../utils/mock-auth";
import { ROLES } from "@/lib/permissions";
import type { SessionUser } from "@/types/auth";
import { GET, POST } from "@/app/api/admin/users/route";
import { PATCH, DELETE } from "@/app/api/admin/users/[id]/route";
import { POST as ResetPasswordPOST } from "@/app/api/admin/users/[id]/reset-password/route";
import { POST as ResendInvitePOST } from "@/app/api/admin/users/[id]/resend-invite/route";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    campaign: {
      count: jest.fn(),
    },
    candidate: {
      count: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  },
}), { virtual: true });

jest.mock("@/lib/audit", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}), { virtual: true });

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}), { virtual: true });

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}), { virtual: true });

jest.mock("@/lib/email", () => ({
  sendInviteEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
}), { virtual: true });

const { prisma } = require("@/lib/prisma");
const { requireAuth, requireRole } = require("@/lib/auth");
const { logAction } = require("@/lib/audit");
const { sendInviteEmail, sendPasswordResetEmail } = require("@/lib/email");

describe("Admin User Management API", () => {
  let platformAdmin: SessionUser;
  let regularUser: SessionUser;

  beforeEach(() => {
    jest.clearAllMocks();

    platformAdmin = createTestUser({
      id: "admin-1",
      email: "admin@test.com",
      name: "Platform Admin",
      role: ROLES.PLATFORM_ADMIN,
      isInternal: true,
    });

    regularUser = createTestUser({
      id: "user-1",
      email: "user@test.com",
      name: "Regular User",
      role: ROLES.RECRUITER,
    });

    requireAuth.mockResolvedValue(platformAdmin);
    requireRole.mockImplementation((user: SessionUser, role: string) => {
      if (user.role !== role) {
        throw new Error("Forbidden");
      }
    });
  });

  describe("GET /api/admin/users", () => {
    it("should return 403 for non-admin users", async () => {
      requireAuth.mockResolvedValue(regularUser);

      const request = new NextRequest("http://localhost/api/admin/users");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it("should return users list for platform admin", async () => {
      const mockUsers = [
        {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
          role: ROLES.RECRUITER,
          isActive: true,
          emailVerified: new Date(),
          mustChangePassword: false,
          authProvider: "credentials",
          clientId: null,
          client: null,
          createdAt: new Date(),
        },
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(1);

      const request = new NextRequest("http://localhost/api/admin/users");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.pagination).toBeDefined();
    });

    it("should filter by search query", async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const request = new NextRequest("http://localhost/api/admin/users?search=test");
      await GET(request);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ email: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it("should filter by role", async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const request = new NextRequest("http://localhost/api/admin/users?role=RECRUITER");
      await GET(request);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: ROLES.RECRUITER,
          }),
        })
      );
    });

    it("should filter by status", async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const request = new NextRequest("http://localhost/api/admin/users?status=ACTIVE");
      await GET(request);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });
  });

  describe("POST /api/admin/users", () => {
    it("should create a new user", async () => {
      const newUser = {
        id: "new-user-1",
        name: "New User",
        email: "newuser@example.com",
        role: ROLES.RECRUITER,
        isActive: true,
        emailVerified: null,
        mustChangePassword: false,
        authProvider: "credentials",
        clientId: null,
        client: null,
        createdAt: new Date(),
      };

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(newUser);

      const request = new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "New User",
          email: "newuser@example.com",
          role: ROLES.RECRUITER,
          isActive: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe("newuser@example.com");
      expect(prisma.user.create).toHaveBeenCalled();
      expect(logAction).toHaveBeenCalledWith(
        platformAdmin,
        "USER_CREATED",
        newUser.id,
        "User",
        expect.any(Object)
      );
    });

    it("should send invite email when sendInvite is true", async () => {
      const newUser = {
        id: "new-user-2",
        name: "Invited User",
        email: "invited@example.com",
        role: ROLES.RECRUITER,
        isActive: true,
        emailVerified: null,
        mustChangePassword: false,
        authProvider: "credentials",
        clientId: null,
        client: null,
        createdAt: new Date(),
      };

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(newUser);

      const request = new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Invited User",
          email: "invited@example.com",
          role: ROLES.RECRUITER,
          isActive: true,
          sendInvite: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.inviteEmailSent).toBe(true);
      expect(sendInviteEmail).toHaveBeenCalledTimes(1);
      expect(sendInviteEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          toEmail: "invited@example.com",
        })
      );
    });

    it("should validate required fields", async () => {
      const request = new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          // Missing name and role
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("required");
    });

    it("should validate email format", async () => {
      const request = new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "invalid-email",
          role: ROLES.RECRUITER,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("email");
    });

    it("should reject duplicate email", async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: "existing-user",
        email: "existing@example.com",
      });

      const request = new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "existing@example.com",
          role: ROLES.RECRUITER,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("already exists");
    });

    it("should require client for CLIENT_ADMIN role", async () => {
      const request = new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          role: ROLES.CLIENT_ADMIN,
          // Missing clientId
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Client assignment");
    });

    it("should validate client exists for CLIENT_ADMIN", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.client.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          role: ROLES.CLIENT_ADMIN,
          clientId: "invalid-client-id",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Invalid client");
    });
  });

  describe("PATCH /api/admin/users/[id]", () => {
    it("should update user", async () => {
      const existingUser = {
        id: "user-1",
        name: "Old Name",
        email: "user@example.com",
        role: ROLES.RECRUITER,
        isActive: true,
        isInternal: false,
      };

      const updatedUser = {
        ...existingUser,
        name: "New Name",
        isActive: false,
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.campaign.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue(updatedUser);

      const request = new NextRequest("http://localhost/api/admin/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({
          name: "New Name",
          isActive: false,
        }),
      });

      const response = await PATCH(request, { params: { id: "user-1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New Name");
      expect(logAction).toHaveBeenCalledWith(
        platformAdmin,
        "USER_UPDATED",
        "user-1",
        "User",
        expect.any(Object)
      );
    });

    it("should prevent role change if user has active campaigns", async () => {
      const existingUser = {
        id: "user-1",
        role: ROLES.RECRUITER,
        isInternal: false,
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.campaign.count.mockResolvedValue(2); // Has active campaigns

      const request = new NextRequest("http://localhost/api/admin/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({
          role: ROLES.CLIENT_ADMIN,
        }),
      });

      const response = await PATCH(request, { params: { id: "user-1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("active campaign");
    });

    it("should return 404 for non-existent user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/admin/users/non-existent", {
        method: "PATCH",
        body: JSON.stringify({
          name: "New Name",
        }),
      });

      const response = await PATCH(request, { params: { id: "non-existent" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe("DELETE /api/admin/users/[id]", () => {
    it("should soft delete user", async () => {
      const existingUser = {
        id: "user-1",
        email: "user@example.com",
        role: ROLES.RECRUITER,
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.campaign.count.mockResolvedValue(0);
      prisma.candidate.count.mockResolvedValue(0);
      prisma.$executeRaw.mockResolvedValue(1);
      prisma.user.findUnique.mockResolvedValueOnce(existingUser).mockResolvedValueOnce({
        ...existingUser,
        deletedAt: new Date(),
        isActive: false,
      });

      const request = new NextRequest("http://localhost/api/admin/users/user-1", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: { id: "user-1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(logAction).toHaveBeenCalledWith(
        platformAdmin,
        "USER_DELETED",
        "user-1",
        "User",
        expect.any(Object)
      );
    });

    it("should prevent deleting user with active campaigns", async () => {
      const existingUser = {
        id: "user-1",
        email: "user@example.com",
        role: ROLES.RECRUITER,
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.campaign.count.mockResolvedValue(3); // Has active campaigns

      const request = new NextRequest("http://localhost/api/admin/users/user-1", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: { id: "user-1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("active campaign");
    });

    it("should prevent deleting own account", async () => {
      const selfUser = {
        id: platformAdmin.id,
        email: platformAdmin.email,
        role: platformAdmin.role,
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(selfUser);
      prisma.campaign.count.mockResolvedValue(0);

      const request = new NextRequest(`http://localhost/api/admin/users/${platformAdmin.id}`, {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: { id: platformAdmin.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Cannot delete your own account");
    });
  });

  describe("POST /api/admin/users/[id]/reset-password", () => {
    it("should reset password for credentials user", async () => {
      const existingUser = {
        id: "user-1",
        email: "user@example.com",
        authProvider: "credentials",
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue({
        ...existingUser,
        mustChangePassword: true,
      });

      const request = new NextRequest("http://localhost/api/admin/users/user-1/reset-password", {
        method: "POST",
      });

      const response = await ResetPasswordPOST(request, { params: { id: "user-1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Password");
      expect(logAction).toHaveBeenCalledWith(
        platformAdmin,
        "USER_PASSWORD_RESET",
        "user-1",
        "User",
        expect.any(Object)
      );
      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });

    it("should reject password reset for OAuth users", async () => {
      const oauthUser = {
        id: "user-1",
        email: "user@example.com",
        authProvider: "azureadb2c",
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(oauthUser);

      const request = new NextRequest("http://localhost/api/admin/users/user-1/reset-password", {
        method: "POST",
      });

      const response = await ResetPasswordPOST(request, { params: { id: "user-1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("OAuth users");
    });
  });

  describe("POST /api/admin/users/[id]/resend-invite", () => {
    it("should resend invite for credentials user", async () => {
      const existingUser = {
        id: "user-1",
        email: "user@example.com",
        name: "Test User",
        authProvider: "credentials",
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue({
        ...existingUser,
        mustChangePassword: false,
      });

      const request = new NextRequest("http://localhost/api/admin/users/user-1/resend-invite", {
        method: "POST",
      });

      const response = await ResendInvitePOST(request, { params: { id: "user-1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.inviteEmailSent).toBe(true);
      expect(sendInviteEmail).toHaveBeenCalledTimes(1);
      expect(logAction).toHaveBeenCalledWith(
        platformAdmin,
        "USER_INVITE_RESENT",
        "user-1",
        "User",
        expect.any(Object)
      );
    });

    it("should reject resend invite for OAuth users", async () => {
      const oauthUser = {
        id: "user-1",
        email: "user@example.com",
        authProvider: "azureadb2c",
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(oauthUser);

      const request = new NextRequest("http://localhost/api/admin/users/user-1/resend-invite", {
        method: "POST",
      });

      const response = await ResendInvitePOST(request, { params: { id: "user-1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("OAuth users");
    });
  });
});








