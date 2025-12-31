/**
 * @jest-environment node
 */

/**
 * Tenant Isolation Integration Tests for ELITE API Routes
 * 
 * These tests verify that users in one tenant cannot access data from another tenant.
 * Cross-tenant access must return 404 (preferred) or 403 - never the actual data.
 * 
 * Approach: Mock the auth/context layer and services to verify:
 * 1. Context resolution returns tenant-scoped context
 * 2. Services are called with correct tenant scope
 * 3. Missing data (wrong tenant) returns 404
 */

import { NextRequest } from "next/server";

// Mock the auth and context modules
jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/elite/kernel/context", () => ({
  resolveEliteContext: jest.fn(),
}));

jest.mock("@/lib/elite/services/cohort", () => ({
  cohortService: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("@/lib/elite/services/session", () => ({
  sessionService: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
  },
}));

import { requireAuth } from "@/lib/auth";
import { resolveEliteContext } from "@/lib/elite/kernel/context";
import { cohortService } from "@/lib/elite/services/cohort";
import { sessionService } from "@/lib/elite/services/session";
import { GET as getCohortById } from "@/app/api/elite/cohorts/[id]/route";
import { GET as getCohorts } from "@/app/api/elite/cohorts/route";
import { GET as getSessionById } from "@/app/api/elite/sessions/[id]/route";
import { ELITE_PERMISSIONS } from "@/lib/elite/permissions";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockResolveEliteContext = resolveEliteContext as jest.MockedFunction<typeof resolveEliteContext>;
const mockCohortService = cohortService as jest.Mocked<typeof cohortService>;
const mockSessionService = sessionService as jest.Mocked<typeof sessionService>;

// Helper to create a mock session
function mockSession(clientId: string, userId: string = "user1") {
  return {
    id: userId,
    email: `${userId}@example.com`,
    name: "Test User",
    role: "CLIENT_USER",
    clientId,
    isInternal: false,
    mustChangePassword: false,
  };
}

// Helper to create a mock ELITE context
function mockEliteContext(
  tenantId: string,
  userId: string = "user1",
  role: string = "PROGRAM_ADMIN"
) {
  const permissionsByRole: Record<string, string[]> = {
    PROGRAM_ADMIN: Object.values(ELITE_PERMISSIONS),
    LEARNER: [
      ELITE_PERMISSIONS.ACCESS_ELITE_WORKSPACE,
      ELITE_PERMISSIONS.VIEW_COHORTS,
      ELITE_PERMISSIONS.VIEW_SESSIONS,
      ELITE_PERMISSIONS.SUBMIT_ASSIGNMENTS,
      ELITE_PERMISSIONS.VIEW_ARTIFACTS,
      ELITE_PERMISSIONS.SEND_MESSAGES,
      ELITE_PERMISSIONS.VIEW_TASKS,
    ],
    COACH: [
      ELITE_PERMISSIONS.ACCESS_ELITE_WORKSPACE,
      ELITE_PERMISSIONS.VIEW_COHORTS,
      ELITE_PERMISSIONS.VIEW_SESSIONS,
      ELITE_PERMISSIONS.RECORD_ATTENDANCE,
      ELITE_PERMISSIONS.MANAGE_COACHING,
      ELITE_PERMISSIONS.VIEW_COACHING,
    ],
  };

  return {
    tenantId,
    tenantName: `Tenant ${tenantId}`,
    userId,
    orgUnitId: "org1",
    orgUnitIds: ["org1"],
    eliteRole: role,
    effectivePermissions: permissionsByRole[role] || [],
    cohortIds: [],
    featureFlags: {},
  };
}

function createRequest(url: string, method: string = "GET") {
  return new NextRequest(new URL(url, "http://localhost"), { method });
}

describe("ELITE Tenant Isolation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Cohort access across tenants", () => {
    it("returns 404 when tenant B user tries to access tenant A cohort by ID", async () => {
      // Setup: User is in tenant B
      const tenantBSession = mockSession("tenantB", "userB");
      const tenantBContext = mockEliteContext("tenantB", "userB", "PROGRAM_ADMIN");

      mockRequireAuth.mockResolvedValue(tenantBSession as any);
      mockResolveEliteContext.mockResolvedValue(tenantBContext as any);

      // The cohort service returns null because it enforces tenant scope
      // (cohort belongs to tenant A, user is in tenant B)
      mockCohortService.getById.mockResolvedValue(null);

      // Attempt to access a cohort that exists in tenant A
      const cohortIdFromTenantA = "cohort_tenantA_001";
      const request = createRequest(`http://localhost/api/elite/cohorts/${cohortIdFromTenantA}`);
      
      const response = await getCohortById(request, {
        params: Promise.resolve({ id: cohortIdFromTenantA }),
      });

      // Must return 404 - never expose that the cohort exists in another tenant
      expect(response.status).toBe(404);
      
      // Verify service was called with the correct context (tenant B)
      expect(mockCohortService.getById).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenantB",
        }),
        cohortIdFromTenantA
      );
    });

    it("returns 200 when user accesses cohort in their own tenant", async () => {
      // Setup: User is in tenant A
      const tenantASession = mockSession("tenantA", "userA");
      const tenantAContext = mockEliteContext("tenantA", "userA", "PROGRAM_ADMIN");

      mockRequireAuth.mockResolvedValue(tenantASession as any);
      mockResolveEliteContext.mockResolvedValue(tenantAContext as any);

      // Cohort exists in tenant A - service returns it
      const cohortData = {
        id: "cohort_tenantA_001",
        clientId: "tenantA",
        name: "Test Cohort",
        status: "ACTIVE",
        programTemplate: { id: "tmpl1", name: "Template 1" },
        orgUnit: null,
        memberCount: 5,
        sessionCount: 3,
      };
      mockCohortService.getById.mockResolvedValue(cohortData as any);

      const request = createRequest("http://localhost/api/elite/cohorts/cohort_tenantA_001");
      
      const response = await getCohortById(request, {
        params: Promise.resolve({ id: "cohort_tenantA_001" }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.id).toBe("cohort_tenantA_001");
    });

    it("list endpoint only returns cohorts from user's tenant", async () => {
      // Setup: User is in tenant B
      const tenantBSession = mockSession("tenantB", "userB");
      const tenantBContext = mockEliteContext("tenantB", "userB", "PROGRAM_ADMIN");

      mockRequireAuth.mockResolvedValue(tenantBSession as any);
      mockResolveEliteContext.mockResolvedValue(tenantBContext as any);

      // Service returns only tenant B cohorts (enforces tenant scope internally)
      const tenantBCohorts = [
        { id: "cohort_B1", clientId: "tenantB", name: "Cohort B1" },
        { id: "cohort_B2", clientId: "tenantB", name: "Cohort B2" },
      ];
      mockCohortService.list.mockResolvedValue(tenantBCohorts as any);

      const request = createRequest("http://localhost/api/elite/cohorts");
      const response = await getCohorts(request);

      expect(response.status).toBe(200);
      
      // Verify service was called with tenant B context
      expect(mockCohortService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenantB",
        })
      );
      
      const body = await response.json();
      expect(body).toHaveLength(2);
      expect(body.every((c: any) => c.clientId === "tenantB")).toBe(true);
    });
  });

  describe("Session access across tenants", () => {
    it("returns 404 when tenant B user tries to access tenant A session", async () => {
      // Setup: User is in tenant B
      const tenantBSession = mockSession("tenantB", "userB");
      const tenantBContext = mockEliteContext("tenantB", "userB", "PROGRAM_ADMIN");

      mockRequireAuth.mockResolvedValue(tenantBSession as any);
      mockResolveEliteContext.mockResolvedValue(tenantBContext as any);

      // Session not found (belongs to different tenant - service enforces scope)
      mockSessionService.getById.mockResolvedValue(null);

      const sessionIdFromTenantA = "session_tenantA_001";
      const request = createRequest(`http://localhost/api/elite/sessions/${sessionIdFromTenantA}`);
      
      const response = await getSessionById(request, {
        params: Promise.resolve({ id: sessionIdFromTenantA }),
      });

      expect(response.status).toBe(404);
      
      // Verify service was called with tenant B context
      expect(mockSessionService.getById).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenantB",
        }),
        sessionIdFromTenantA
      );
    });
  });

  describe("ELITE context denial", () => {
    it("returns 403 when user has no ELITE workspace access", async () => {
      // User is authenticated but has no org memberships -> no ELITE access
      const session = mockSession("tenantA", "userNoElite");
      
      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(null); // No ELITE context

      const request = createRequest("http://localhost/api/elite/cohorts");
      const response = await getCohorts(request);

      expect(response.status).toBe(403);
      
      // Service should NOT be called when context is null
      expect(mockCohortService.list).not.toHaveBeenCalled();
    });

    it("returns 403 when user has no tenant (internal user without ELITE access)", async () => {
      // Internal user with no clientId -> resolveEliteContext returns null
      const internalSession = {
        id: "internal1",
        email: "admin@platform.com",
        name: "Platform Admin",
        role: "PLATFORM_ADMIN",
        clientId: null, // No tenant
        isInternal: true,
        mustChangePassword: false,
      };

      mockRequireAuth.mockResolvedValue(internalSession as any);
      mockResolveEliteContext.mockResolvedValue(null);

      const request = createRequest("http://localhost/api/elite/cohorts");
      const response = await getCohorts(request);

      expect(response.status).toBe(403);
      expect(mockCohortService.list).not.toHaveBeenCalled();
    });
  });

  describe("Tenant context is correctly passed to services", () => {
    it("getById service receives exact tenant from context", async () => {
      const tenantASession = mockSession("tenantA", "userA");
      const tenantAContext = mockEliteContext("tenantA", "userA", "PROGRAM_ADMIN");

      mockRequireAuth.mockResolvedValue(tenantASession as any);
      mockResolveEliteContext.mockResolvedValue(tenantAContext as any);
      mockCohortService.getById.mockResolvedValue(null);

      const request = createRequest("http://localhost/api/elite/cohorts/any-id");
      await getCohortById(request, {
        params: Promise.resolve({ id: "any-id" }),
      });

      // The key assertion: service receives exact tenant context
      const calledContext = mockCohortService.getById.mock.calls[0][0];
      expect(calledContext.tenantId).toBe("tenantA");
      expect(calledContext.userId).toBe("userA");
    });

    it("list service receives exact tenant from context", async () => {
      const tenantCSession = mockSession("tenantC", "userC");
      const tenantCContext = mockEliteContext("tenantC", "userC", "LEARNER");

      mockRequireAuth.mockResolvedValue(tenantCSession as any);
      mockResolveEliteContext.mockResolvedValue(tenantCContext as any);
      mockCohortService.list.mockResolvedValue([]);

      const request = createRequest("http://localhost/api/elite/cohorts");
      await getCohorts(request);

      // The key assertion: service receives exact tenant context
      const calledContext = mockCohortService.list.mock.calls[0][0];
      expect(calledContext.tenantId).toBe("tenantC");
    });
  });
});
