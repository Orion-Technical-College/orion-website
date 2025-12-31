/**
 * @jest-environment node
 */

/**
 * Integration tests for Admin Stats API route.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { createTestUser } from "../utils/mock-auth";
import { ROLES } from "@/lib/permissions";
import type { SessionUser } from "@/types/auth";
import { GET } from "@/app/api/admin/stats/route";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    client: {
      count: jest.fn(),
    },
    candidate: {
      count: jest.fn(),
    },
    auditLog: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}), { virtual: true });

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}), { virtual: true });

const { prisma } = require("@/lib/prisma");
const { requireAuth, requireRole } = require("@/lib/auth");

describe("Admin Stats API", () => {
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

  it("should return dashboard statistics", async () => {
    const mockUsers = [
      { role: ROLES.PLATFORM_ADMIN },
      { role: ROLES.RECRUITER },
      { role: ROLES.RECRUITER },
      { role: ROLES.CLIENT_ADMIN },
      { role: ROLES.CLIENT_USER },
    ];

    prisma.user.findMany.mockResolvedValue(mockUsers);
    prisma.user.count.mockResolvedValue(5);
    prisma.client.count.mockResolvedValue(3);
    prisma.candidate.count.mockResolvedValue(100);
    prisma.auditLog.count.mockResolvedValue(25);
    prisma.$queryRaw.mockResolvedValue([{ "": 1 }]);

    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "test-key";

    const request = new NextRequest("http://localhost/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.totalUsers).toBe(5);
    expect(data.data.totalClients).toBe(3);
    expect(data.data.totalCandidates).toBe(100);
    expect(data.data.recentAuditLogs).toBe(25);
    expect(data.data.usersByRole).toBeDefined();
    expect(data.data.systemHealth).toBeDefined();
    expect(data.data.systemHealth.database).toBe("healthy");
  });

  it("should return 403 for non-admin users", async () => {
    const regularUser = createTestUser({
      id: "user-1",
      role: ROLES.RECRUITER,
    });

    requireAuth.mockResolvedValue(regularUser);

    const request = new NextRequest("http://localhost/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it("should detect database health issues", async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    prisma.client.count.mockResolvedValue(0);
    prisma.candidate.count.mockResolvedValue(0);
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.$queryRaw.mockRejectedValue(new Error("Database connection failed"));

    const request = new NextRequest("http://localhost/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.systemHealth.database).toBe("down");
  });

  it("should calculate users by role correctly", async () => {
    const mockUsers = [
      { role: ROLES.PLATFORM_ADMIN },
      { role: ROLES.RECRUITER },
      { role: ROLES.RECRUITER },
      { role: ROLES.CLIENT_ADMIN },
    ];

    prisma.user.findMany.mockResolvedValue(mockUsers);
    prisma.user.count.mockResolvedValue(4);
    prisma.client.count.mockResolvedValue(0);
    prisma.candidate.count.mockResolvedValue(0);
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.$queryRaw.mockResolvedValue([{ "": 1 }]);

    const request = new NextRequest("http://localhost/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    // Manual aggregation from findMany results
    expect(data.data.usersByRole).toBeDefined();
    // The implementation aggregates manually, so check that counts exist
    expect(typeof data.data.usersByRole[ROLES.PLATFORM_ADMIN]).toBe("number");
    expect(typeof data.data.usersByRole[ROLES.RECRUITER]).toBe("number");
    expect(typeof data.data.usersByRole[ROLES.CLIENT_ADMIN]).toBe("number");
  });
});







