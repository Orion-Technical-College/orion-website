/**
 * @jest-environment node
 */

import { GET, PUT } from "@/app/api/user/api-keys/route";
import { NextRequest } from "next/server";
import { testPrisma } from "@/__tests__/setup/db";
import { makeUser } from "@/__tests__/fixtures/users";
import { cleanDatabase } from "@/__tests__/setup/teardown";
import { ROLES, PERMISSIONS } from "@/lib/permissions";

// Mock auth
jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
  requirePermission: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: require("@/__tests__/setup/db").testPrisma,
}));

import { requireAuth, requirePermission } from "@/lib/auth";

describe("api-keys integration", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("GET /api/user/api-keys", () => {
    it("should return masked API keys for authenticated user", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          isActive: true,
          role: ROLES.RECRUITER,
          googleMessagesApiKey: "sk-test-1234567890abcdef",
          calendlyApiKey: "calendly-key-123456",
          zoomApiKey: "zoom-api-key-abcdef",
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

      (requirePermission as jest.Mock).mockImplementation(() => {});

      const request = new NextRequest("http://localhost/api/user/api-keys");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.googleMessages).toBe("sk-t****cdef");
      expect(data.calendly).toBe("cale****3456");
      expect(data.zoom).toBe("zoom****cdef");
      expect(data.hasGoogleMessages).toBe(true);
      expect(data.hasCalendly).toBe(true);
      expect(data.hasZoom).toBe(true);
    });

    it("should return null for missing API keys", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
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

      (requirePermission as jest.Mock).mockImplementation(() => {});

      const request = new NextRequest("http://localhost/api/user/api-keys");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.googleMessages).toBeNull();
      expect(data.calendly).toBeNull();
      expect(data.zoom).toBeNull();
      expect(data.hasGoogleMessages).toBe(false);
      expect(data.hasCalendly).toBe(false);
      expect(data.hasZoom).toBe(false);
    });

    it("should return 401 when user is not authenticated", async () => {
      (requireAuth as jest.Mock).mockRejectedValue(new Error("Authentication required"));

      const request = new NextRequest("http://localhost/api/user/api-keys");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when user lacks permission", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          isActive: true,
          role: ROLES.CLIENT_USER, // No CONFIGURE_API_KEYS permission
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

      (requirePermission as jest.Mock).mockImplementation(() => {
        throw new Error("Permission CONFIGURE_API_KEYS required");
      });

      const request = new NextRequest("http://localhost/api/user/api-keys");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should never return full API keys", async () => {
      const fullKey = "sk-test-1234567890abcdefghijklmnop";
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          isActive: true,
          role: ROLES.RECRUITER,
          googleMessagesApiKey: fullKey,
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

      (requirePermission as jest.Mock).mockImplementation(() => {});

      const request = new NextRequest("http://localhost/api/user/api-keys");
      const response = await GET(request);
      const responseText = await response.text();
      const data = JSON.parse(responseText);

      expect(response.status).toBe(200);
      // Verify full key is not in response
      expect(responseText).not.toContain(fullKey);
      expect(data.googleMessages).not.toBe(fullKey);
      expect(data.googleMessages).toContain("****");
    });
  });

  describe("PUT /api/user/api-keys", () => {
    it("should update API keys successfully", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
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

      (requirePermission as jest.Mock).mockImplementation(() => {});

      const request = new NextRequest("http://localhost/api/user/api-keys", {
        method: "PUT",
        body: JSON.stringify({
          googleMessages: "sk-new-key-123",
          calendly: "calendly-new-key",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify keys were updated
      const updatedUser = await testPrisma.user.findUnique({
        where: { id: user.id },
        select: {
          googleMessagesApiKey: true,
          calendlyApiKey: true,
          zoomApiKey: true,
        },
      });

      expect(updatedUser?.googleMessagesApiKey).toBe("sk-new-key-123");
      expect(updatedUser?.calendlyApiKey).toBe("calendly-new-key");
    });

    it("should allow updating individual keys", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          isActive: true,
          role: ROLES.RECRUITER,
          googleMessagesApiKey: "sk-old-key",
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

      (requirePermission as jest.Mock).mockImplementation(() => {});

      const request = new NextRequest("http://localhost/api/user/api-keys", {
        method: "PUT",
        body: JSON.stringify({
          googleMessages: "sk-updated-key",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify only googleMessages was updated
      const updatedUser = await testPrisma.user.findUnique({
        where: { id: user.id },
        select: {
          googleMessagesApiKey: true,
          calendlyApiKey: true,
          zoomApiKey: true,
        },
      });

      expect(updatedUser?.googleMessagesApiKey).toBe("sk-updated-key");
    });

    it("should allow clearing API keys (setting to null)", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          isActive: true,
          role: ROLES.RECRUITER,
          googleMessagesApiKey: "sk-old-key",
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

      (requirePermission as jest.Mock).mockImplementation(() => {});

      const request = new NextRequest("http://localhost/api/user/api-keys", {
        method: "PUT",
        body: JSON.stringify({
          googleMessages: null,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify key was cleared
      const updatedUser = await testPrisma.user.findUnique({
        where: { id: user.id },
        select: {
          googleMessagesApiKey: true,
        },
      });

      expect(updatedUser?.googleMessagesApiKey).toBeNull();
    });

    it("should return 400 when no keys are provided", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
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

      (requirePermission as jest.Mock).mockImplementation(() => {});

      const request = new NextRequest("http://localhost/api/user/api-keys", {
        method: "PUT",
        body: JSON.stringify({}),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("At least one API key");
    });

    it("should return 403 when user lacks permission", async () => {
      const user = await testPrisma.user.create({
        data: makeUser({
          email: "test@example.com",
          isActive: true,
          role: ROLES.CLIENT_USER, // No CONFIGURE_API_KEYS permission
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

      (requirePermission as jest.Mock).mockImplementation(() => {
        throw new Error("Permission CONFIGURE_API_KEYS required");
      });

      const request = new NextRequest("http://localhost/api/user/api-keys", {
        method: "PUT",
        body: JSON.stringify({
          googleMessages: "sk-new-key",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });
});

