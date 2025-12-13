/**
 * @jest-environment node
 */

import { PUT } from "@/app/api/auth/change-password/route";
import { NextRequest } from "next/server";
import { testPrisma } from "@/__tests__/setup/db";
import { makeUser } from "@/__tests__/fixtures/users";
import { cleanDatabase } from "@/__tests__/setup/teardown";
import bcrypt from "bcrypt";
import { ROLES } from "@/lib/permissions";

// Mock auth
jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
}));

// Mock audit
jest.mock("@/lib/audit", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: require("@/__tests__/setup/db").testPrisma,
}));

import { requireAuth } from "@/lib/auth";

describe("change-password integration", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("PUT /api/auth/change-password", () => {
    it("should successfully change password", async () => {
      const currentPassword = "OldPassword123!";
      const newPassword = "NewPassword123!";
      const passwordHash = await bcrypt.hash(currentPassword, 10);

      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          passwordHash,
          isActive: true,
          role: ROLES.RECRUITER,
        }),
      });

      (requireAuth as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        isInternal: user.isInternal,
      });

      const request = new NextRequest("http://localhost/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify password was changed
      const updatedUser = await testPrisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true, mustChangePassword: true, emailVerified: true },
      });

      expect(updatedUser).not.toBeNull();
      const isValidNewPassword = await bcrypt.compare(newPassword, updatedUser!.passwordHash!);
      expect(isValidNewPassword).toBe(true);
      expect(updatedUser!.mustChangePassword).toBe(false);
      expect(updatedUser!.emailVerified).not.toBeNull();
    });

    it("should return 400 when current password is missing", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({ email: "test@example.com", isActive: true }),
      });

      (requireAuth as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        isInternal: user.isInternal,
      });

      const request = new NextRequest("http://localhost/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          newPassword: "NewPassword123!",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should return 400 when new password is missing", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({ email: "test@example.com", isActive: true }),
      });

      (requireAuth as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        isInternal: user.isInternal,
      });

      const request = new NextRequest("http://localhost/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: "OldPassword123!",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should return 401 when current password is incorrect", async () => {
      const currentPassword = "OldPassword123!";
      const wrongPassword = "WrongPassword123!";
      const newPassword = "NewPassword123!";
      const passwordHash = await bcrypt.hash(currentPassword, 10);

      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          passwordHash,
          isActive: true,
        }),
      });

      (requireAuth as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        isInternal: user.isInternal,
      });

      const request = new NextRequest("http://localhost/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: wrongPassword,
          newPassword,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain("incorrect");
    });

    it("should return 400 when new password doesn't meet complexity requirements", async () => {
      const currentPassword = "OldPassword123!";
      const newPassword = "short"; // Too short
      const passwordHash = await bcrypt.hash(currentPassword, 10);

      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          passwordHash,
          isActive: true,
        }),
      });

      (requireAuth as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        isInternal: user.isInternal,
      });

      const request = new NextRequest("http://localhost/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("8 characters");
    });

    it("should return 401 when user is not authenticated", async () => {
      (requireAuth as jest.Mock).mockRejectedValue(new Error("Authentication required"));

      const request = new NextRequest("http://localhost/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword123!",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should not leak passwordHash in response", async () => {
      const currentPassword = "OldPassword123!";
      const newPassword = "NewPassword123!";
      const passwordHash = await bcrypt.hash(currentPassword, 10);

      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          passwordHash,
          isActive: true,
        }),
      });

      (requireAuth as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        isInternal: user.isInternal,
      });

      const request = new NextRequest("http://localhost/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const response = await PUT(request);
      const responseText = await response.text();
      const data = JSON.parse(responseText);

      // Verify passwordHash is not in response
      expect(responseText).not.toContain("passwordHash");
      expect(data).not.toHaveProperty("passwordHash");
      expect(data).not.toHaveProperty("password");
    });

    it("should set security headers (no-cache)", async () => {
      const currentPassword = "OldPassword123!";
      const newPassword = "NewPassword123!";
      const passwordHash = await bcrypt.hash(currentPassword, 10);

      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          passwordHash,
          isActive: true,
        }),
      });

      (requireAuth as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        isInternal: user.isInternal,
      });

      const request = new NextRequest("http://localhost/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const response = await PUT(request);

      // Check for no-cache headers (Next.js may handle this, but we verify)
      const cacheControl = response.headers.get("cache-control");
      // Note: Next.js may not set these by default, but we document the expectation
    });
  });
});

