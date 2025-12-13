/**
 * @jest-environment node
 */

/**
 * Integration tests for Admin Client Management API routes.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { createTestUser } from "../utils/mock-auth";
import { ROLES } from "@/lib/permissions";
import type { SessionUser } from "@/types/auth";
import { GET, POST } from "@/app/api/admin/clients/route";
import { PATCH, DELETE } from "@/app/api/admin/clients/[id]/route";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    candidate: {
      count: jest.fn(),
    },
    $executeRaw: jest.fn(),
  },
}), { virtual: true });

jest.mock("@/lib/audit", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}), { virtual: true });

jest.mock("@/lib/admin-helpers", () => ({
  canDeleteClient: jest.fn(),
}), { virtual: true });

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}), { virtual: true });

const { prisma } = require("@/lib/prisma");
const { requireAuth, requireRole } = require("@/lib/auth");
const { logAction } = require("@/lib/audit");
const { canDeleteClient } = require("@/lib/admin-helpers");

describe("Admin Client Management API", () => {
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

  describe("GET /api/admin/clients", () => {
    it("should return clients list", async () => {
      const mockClients = [
        {
          id: "client-1",
          name: "Test Client",
          domain: "test.com",
          isActive: true,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.client.findMany.mockResolvedValue(mockClients);
      prisma.client.count.mockResolvedValue(1);
      prisma.user.count.mockResolvedValue(5);
      prisma.candidate.count.mockResolvedValue(10);

      const request = new NextRequest("http://localhost/api/admin/clients");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toHaveProperty("userCount");
      expect(data.data[0]).toHaveProperty("candidateCount");
    });

    it("should filter by search query", async () => {
      prisma.client.findMany.mockResolvedValue([]);
      prisma.client.count.mockResolvedValue(0);

      const request = new NextRequest("http://localhost/api/admin/clients?search=test");
      await GET(request);

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe("POST /api/admin/clients", () => {
    it("should create a new client", async () => {
      const newClient = {
        id: "new-client-1",
        name: "New Client",
        domain: "newclient.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.client.findFirst.mockResolvedValue(null);
      prisma.client.create.mockResolvedValue(newClient);

      const request = new NextRequest("http://localhost/api/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          name: "New Client",
          domain: "newclient.com",
          isActive: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New Client");
      expect(logAction).toHaveBeenCalledWith(
        platformAdmin,
        "CLIENT_CREATED",
        newClient.id,
        "Client",
        expect.any(Object)
      );
    });

    it("should validate client name length", async () => {
      const request = new NextRequest("http://localhost/api/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          name: "A", // Too short
          isActive: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("at least 2 characters");
    });

    it("should validate domain format", async () => {
      const request = new NextRequest("http://localhost/api/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Client",
          domain: "invalid-domain-format",
          isActive: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("domain");
    });

    it("should reject duplicate client name", async () => {
      prisma.client.findFirst.mockResolvedValue({
        id: "existing-client",
        name: "Existing Client",
      });

      const request = new NextRequest("http://localhost/api/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          name: "Existing Client",
          isActive: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("already exists");
    });
  });

  describe("PATCH /api/admin/clients/[id]", () => {
    it("should update client", async () => {
      const existingClient = {
        id: "client-1",
        name: "Old Name",
        domain: "old.com",
        isActive: true,
        deletedAt: null,
      };

      const updatedClient = {
        ...existingClient,
        name: "New Name",
        domain: "new.com",
      };

      prisma.client.findUnique.mockResolvedValue(existingClient);
      prisma.client.findFirst.mockResolvedValue(null); // No duplicate
      prisma.client.update.mockResolvedValue(updatedClient);

      const request = new NextRequest("http://localhost/api/admin/clients/client-1", {
        method: "PATCH",
        body: JSON.stringify({
          name: "New Name",
          domain: "new.com",
        }),
      });

      const response = await PATCH(request, { params: { id: "client-1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New Name");
      expect(logAction).toHaveBeenCalledWith(
        platformAdmin,
        "CLIENT_UPDATED",
        "client-1",
        "Client",
        expect.any(Object)
      );
    });

    it("should return 404 for non-existent client", async () => {
      prisma.client.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/admin/clients/non-existent", {
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

  describe("DELETE /api/admin/clients/[id]", () => {
    it("should soft delete client", async () => {
      const existingClient = {
        id: "client-1",
        name: "Test Client",
        deletedAt: null,
      };

      prisma.client.findUnique.mockResolvedValue(existingClient);
      canDeleteClient.mockResolvedValue({ canDelete: true });
      prisma.$executeRaw.mockResolvedValue(1);
      prisma.client.findUnique.mockResolvedValueOnce(existingClient).mockResolvedValueOnce({
        ...existingClient,
        deletedAt: new Date(),
        isActive: false,
      });

      const request = new NextRequest("http://localhost/api/admin/clients/client-1", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: { id: "client-1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(logAction).toHaveBeenCalledWith(
        platformAdmin,
        "CLIENT_DELETED",
        "client-1",
        "Client",
        expect.any(Object)
      );
    });

    it("should prevent deleting client with users or candidates", async () => {
      const existingClient = {
        id: "client-1",
        name: "Test Client",
        deletedAt: null,
      };

      prisma.client.findUnique.mockResolvedValue(existingClient);
      canDeleteClient.mockResolvedValue({
        canDelete: false,
        reason: "Cannot delete client with active users or candidates",
        details: { users: 5, candidates: 10 },
      });

      const request = new NextRequest("http://localhost/api/admin/clients/client-1", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: { id: "client-1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Cannot delete");
      expect(data.error.details).toBeDefined();
    });
  });
});



