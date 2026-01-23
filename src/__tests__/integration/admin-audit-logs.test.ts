/**
 * @jest-environment node
 */

/**
 * Integration tests for Admin Audit Logs API routes.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { createTestUser } from "../utils/mock-auth";
import { ROLES } from "@/lib/permissions";
import type { SessionUser } from "@/types/auth";
import { GET } from "@/app/api/admin/audit-logs/route";
import { GET as ExportGET } from "@/app/api/admin/audit-logs/export/route";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}), { virtual: true });

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}), { virtual: true });

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockReturnValue({
    allowed: true,
    remaining: 4,
    resetAt: Date.now() + 60000,
  }),
}), { virtual: true });

const { prisma } = require("@/lib/prisma");
const { requireAuth, requireRole } = require("@/lib/auth");
const { checkRateLimit } = require("@/lib/rate-limit");

describe("Admin Audit Logs API", () => {
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

  describe("GET /api/admin/audit-logs", () => {
    it("should return audit logs list", async () => {
      const mockLogs = [
        {
          id: "log-1",
          actorId: "user-1",
          actorRole: ROLES.PLATFORM_ADMIN,
          action: "USER_CREATED",
          targetType: "User",
          targetId: "user-2",
          metadata: JSON.stringify({ email: "newuser@example.com" }),
          createdAt: new Date(),
        },
      ];

      const mockActors = [
        {
          id: "user-1",
          name: "Admin User",
          email: "admin@example.com",
        },
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue(mockActors);

      const request = new NextRequest("http://localhost/api/admin/audit-logs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toHaveProperty("actorName");
      expect(data.data[0]).toHaveProperty("metadataPreview");
    });

    it("should filter by action", async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.user.findMany.mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/admin/audit-logs?action=USER_CREATED");
      await GET(request);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: expect.objectContaining({
              contains: "USER_CREATED",
            }),
          }),
        })
      );
    });

    it("should filter by actor role", async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.user.findMany.mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/admin/audit-logs?actorRole=PLATFORM_ADMIN");
      await GET(request);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            actorRole: ROLES.PLATFORM_ADMIN,
          }),
        })
      );
    });

    it("should filter by date range", async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.user.findMany.mockResolvedValue([]);

      const startDate = "2025-01-01";
      const endDate = "2025-01-31";

      const request = new NextRequest(
        `http://localhost/api/admin/audit-logs?startDate=${startDate}&endDate=${endDate}`
      );
      await GET(request);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it("should redact PII from metadata", async () => {
      const mockLogs = [
        {
          id: "log-1",
          actorId: "user-1",
          actorRole: ROLES.PLATFORM_ADMIN,
          action: "USER_CREATED",
          targetType: "User",
          targetId: "user-2",
          metadata: JSON.stringify({ email: "test@example.com", phone: "555-1234" }),
          createdAt: new Date(),
        },
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/admin/audit-logs");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Metadata should have PII redacted
      expect(data.data[0].metadataPreview).not.toContain("test@example.com");
      expect(data.data[0].metadataPreview).toContain("[EMAIL]");
    });
  });

  describe("GET /api/admin/audit-logs/export", () => {
    it("should export audit logs as CSV", async () => {
      const mockLogs = [
        {
          id: "log-1",
          actorId: "user-1",
          actorRole: ROLES.PLATFORM_ADMIN,
          action: "USER_CREATED",
          targetType: "User",
          targetId: "user-2",
          metadata: JSON.stringify({ email: "test@example.com" }),
          createdAt: new Date(),
        },
      ];

      const mockActors = [
        {
          id: "user-1",
          name: "Admin User",
          email: "admin@example.com",
        },
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.user.findMany.mockResolvedValue(mockActors);

      const request = new NextRequest("http://localhost/api/admin/audit-logs/export");
      const response = await ExportGET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv");
      expect(response.headers.get("Content-Disposition")).toContain("attachment");

      const csv = await response.text();
      expect(csv).toContain("Timestamp");
      expect(csv).toContain("Actor");
      expect(csv).toContain("Action");
    });

    it("should enforce rate limiting", async () => {
      checkRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      const request = new NextRequest("http://localhost/api/admin/audit-logs/export");
      const response = await ExportGET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("rate limit");
    });

    it("should limit export to 10,000 rows", async () => {
      const manyLogs = Array.from({ length: 15000 }, (_, i) => ({
        id: `log-${i}`,
        actorId: "user-1",
        actorRole: ROLES.PLATFORM_ADMIN,
        action: "TEST_ACTION",
        targetType: null,
        targetId: null,
        metadata: null,
        createdAt: new Date(),
      }));

      prisma.auditLog.findMany.mockResolvedValue(manyLogs.slice(0, 10000));
      prisma.user.findMany.mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/admin/audit-logs/export");
      await ExportGET(request);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10000,
        })
      );
    });

    it("should redact PII in exported CSV", async () => {
      const mockLogs = [
        {
          id: "log-1",
          actorId: "user-1",
          actorRole: ROLES.PLATFORM_ADMIN,
          action: "USER_CREATED",
          targetType: "User",
          targetId: "user-2",
          metadata: JSON.stringify({ email: "test@example.com", phone: "555-1234" }),
          createdAt: new Date(),
        },
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.user.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost/api/admin/audit-logs/export?includeMetadata=true"
      );
      const response = await ExportGET(request);
      const csv = await response.text();

      expect(csv).not.toContain("test@example.com");
      expect(csv).toContain("[EMAIL]");
      expect(csv).toContain("[PHONE]");
    });
  });
});








