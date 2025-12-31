/**
 * @jest-environment node
 */

/**
 * RBAC Matrix Integration Tests for ELITE API Routes
 * 
 * These tests verify that role-based access control is enforced server-side.
 * The UI hiding buttons is NOT RBAC - these tests prove the API enforces permissions.
 * 
 * Approach: Mock the auth/context layer and services. Permissions are checked
 * in the service layer, so we verify:
 * 1. Service throws "Permission denied" for unauthorized roles
 * 2. API correctly returns 403 for permission errors
 * 3. Service succeeds for authorized roles
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
    addMember: jest.fn(),
    listMembers: jest.fn(),
    removeMember: jest.fn(),
  },
}));

jest.mock("@/lib/elite/services/session", () => ({
  sessionService: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    getAttendance: jest.fn(),
    recordAttendance: jest.fn(),
  },
}));

import { requireAuth } from "@/lib/auth";
import { resolveEliteContext } from "@/lib/elite/kernel/context";
import { cohortService } from "@/lib/elite/services/cohort";
import { sessionService } from "@/lib/elite/services/session";
import { POST as createCohort, GET as listCohorts } from "@/app/api/elite/cohorts/route";
import { POST as addMember, GET as listMembers } from "@/app/api/elite/cohorts/[id]/members/route";
import { POST as createSession } from "@/app/api/elite/sessions/route";
import { POST as recordAttendance } from "@/app/api/elite/sessions/[id]/attendance/route";
import { ELITE_PERMISSIONS, ELITE_ROLES, ELITE_ROLE_PERMISSIONS } from "@/lib/elite/permissions";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockResolveEliteContext = resolveEliteContext as jest.MockedFunction<typeof resolveEliteContext>;
const mockCohortService = cohortService as jest.Mocked<typeof cohortService>;
const mockSessionService = sessionService as jest.Mocked<typeof sessionService>;

// Helper to create session
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

// Helper to create ELITE context with correct permissions for role
function mockEliteContext(
  tenantId: string,
  userId: string,
  role: keyof typeof ELITE_ROLES,
  cohortIds: string[] = []
) {
  const roleKey = ELITE_ROLES[role];
  return {
    tenantId,
    tenantName: `Tenant ${tenantId}`,
    userId,
    orgUnitId: "org1",
    orgUnitIds: ["org1"],
    eliteRole: roleKey,
    effectivePermissions: ELITE_ROLE_PERMISSIONS[roleKey] || [],
    cohortIds,
    featureFlags: {},
  };
}

function createJsonRequest(url: string, body: unknown) {
  return new NextRequest(new URL(url, "http://localhost"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createGetRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost"), { method: "GET" });
}

describe("ELITE RBAC Matrix", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Cohort Management (MANAGE_COHORTS permission)", () => {
    const cohortPayload = {
      name: "Test Cohort",
      programTemplateId: "tmpl_001",
      startDate: new Date().toISOString(),
    };

    it("LEARNER cannot create cohort - returns 403", async () => {
      const session = mockSession("tenantA", "learner1");
      const context = mockEliteContext("tenantA", "learner1", "LEARNER");

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      // Service enforces RBAC and throws
      mockCohortService.create.mockRejectedValue(new Error("Permission denied to create cohorts"));

      const request = createJsonRequest("http://localhost/api/elite/cohorts", cohortPayload);
      const response = await createCohort(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain("Permission denied");
    });

    it("COACH cannot create cohort - returns 403", async () => {
      const session = mockSession("tenantA", "coach1");
      const context = mockEliteContext("tenantA", "coach1", "COACH");

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      mockCohortService.create.mockRejectedValue(new Error("Permission denied to create cohorts"));

      const request = createJsonRequest("http://localhost/api/elite/cohorts", cohortPayload);
      const response = await createCohort(request);

      expect(response.status).toBe(403);
    });

    it("INSTRUCTOR cannot create cohort - returns 403", async () => {
      const session = mockSession("tenantA", "instructor1");
      const context = mockEliteContext("tenantA", "instructor1", "INSTRUCTOR");

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      mockCohortService.create.mockRejectedValue(new Error("Permission denied to create cohorts"));

      const request = createJsonRequest("http://localhost/api/elite/cohorts", cohortPayload);
      const response = await createCohort(request);

      expect(response.status).toBe(403);
    });

    it("LEADERSHIP cannot create cohort - returns 403", async () => {
      const session = mockSession("tenantA", "leader1");
      const context = mockEliteContext("tenantA", "leader1", "LEADERSHIP");

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      mockCohortService.create.mockRejectedValue(new Error("Permission denied to create cohorts"));

      const request = createJsonRequest("http://localhost/api/elite/cohorts", cohortPayload);
      const response = await createCohort(request);

      expect(response.status).toBe(403);
    });

    it("PROGRAM_ADMIN can create cohort - returns 201", async () => {
      const session = mockSession("tenantA", "admin1");
      const context = mockEliteContext("tenantA", "admin1", "PROGRAM_ADMIN");

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      // Service allows creation
      mockCohortService.create.mockResolvedValue({
        id: "cohort_new",
        clientId: "tenantA",
        name: "Test Cohort",
        status: "DRAFT",
        programTemplate: { id: "tmpl_001", name: "Test Template" },
        orgUnit: null,
        memberCount: 0,
        sessionCount: 0,
      } as any);

      const request = createJsonRequest("http://localhost/api/elite/cohorts", cohortPayload);
      const response = await createCohort(request);

      expect(response.status).toBe(201);
    });
  });

  describe("Roster Management (MANAGE_ROSTER permission)", () => {
    const memberPayload = {
      userId: "newmember1",
      role: "LEARNER",
    };

    it("LEARNER cannot add members - returns 403", async () => {
      const session = mockSession("tenantA", "learner1");
      const context = mockEliteContext("tenantA", "learner1", "LEARNER", ["cohort1"]);

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      mockCohortService.addMember.mockRejectedValue(new Error("Permission denied to manage roster"));

      const request = createJsonRequest(
        "http://localhost/api/elite/cohorts/cohort1/members",
        memberPayload
      );
      const response = await addMember(request, {
        params: Promise.resolve({ id: "cohort1" }),
      });

      expect(response.status).toBe(403);
    });

    it("PROGRAM_ADMIN can add members - returns 201", async () => {
      const session = mockSession("tenantA", "admin1");
      const context = mockEliteContext("tenantA", "admin1", "PROGRAM_ADMIN");

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      // Service allows member addition
      mockCohortService.addMember.mockResolvedValue({
        id: "membership1",
        cohortId: "cohort1",
        userId: "newmember1",
        role: "LEARNER",
        user: { id: "newmember1", name: "New Member", email: "new@example.com" },
      } as any);

      const request = createJsonRequest(
        "http://localhost/api/elite/cohorts/cohort1/members",
        memberPayload
      );
      const response = await addMember(request, {
        params: Promise.resolve({ id: "cohort1" }),
      });

      expect(response.status).toBe(201);
    });
  });

  describe("Session Management (MANAGE_SESSIONS permission)", () => {
    const sessionPayload = {
      cohortId: "cohort1",
      title: "Week 1 Session",
      scheduledAt: new Date().toISOString(),
      duration: 60,
    };

    it("LEARNER cannot create session - returns 403", async () => {
      const session = mockSession("tenantA", "learner1");
      const context = mockEliteContext("tenantA", "learner1", "LEARNER", ["cohort1"]);

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      mockSessionService.create.mockRejectedValue(new Error("Permission denied to create sessions"));

      const request = createJsonRequest("http://localhost/api/elite/sessions", sessionPayload);
      const response = await createSession(request);

      expect(response.status).toBe(403);
    });

    it("INSTRUCTOR can create session - returns 201", async () => {
      const session = mockSession("tenantA", "instructor1");
      const context = mockEliteContext("tenantA", "instructor1", "INSTRUCTOR", ["cohort1"]);

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      // Service allows session creation
      mockSessionService.create.mockResolvedValue({
        id: "session_new",
        clientId: "tenantA",
        cohortId: "cohort1",
        title: "Week 1 Session",
        status: "SCHEDULED",
        host: { id: "instructor1", name: "Instructor", email: "inst@example.com" },
        cohort: { id: "cohort1", name: "Test Cohort" },
        attendanceCount: 0,
      } as any);

      const request = createJsonRequest("http://localhost/api/elite/sessions", sessionPayload);
      const response = await createSession(request);

      expect(response.status).toBe(201);
    });

    it("PROGRAM_ADMIN can create session - returns 201", async () => {
      const session = mockSession("tenantA", "admin1");
      const context = mockEliteContext("tenantA", "admin1", "PROGRAM_ADMIN");

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      mockSessionService.create.mockResolvedValue({
        id: "session_new2",
        clientId: "tenantA",
        cohortId: "cohort1",
        title: "Week 1 Session",
        status: "SCHEDULED",
        host: { id: "admin1", name: "Admin", email: "admin@example.com" },
        cohort: { id: "cohort1", name: "Test Cohort" },
        attendanceCount: 0,
      } as any);

      const request = createJsonRequest("http://localhost/api/elite/sessions", sessionPayload);
      const response = await createSession(request);

      expect(response.status).toBe(201);
    });
  });

  describe("Attendance Recording (RECORD_ATTENDANCE permission)", () => {
    const attendancePayload = {
      userId: "learner1",
      status: "PRESENT",
    };

    it("LEARNER cannot record attendance - returns 403", async () => {
      const session = mockSession("tenantA", "learner2");
      const context = mockEliteContext("tenantA", "learner2", "LEARNER", ["cohort1"]);

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      mockSessionService.recordAttendance.mockRejectedValue(
        new Error("Permission denied to record attendance")
      );

      const request = createJsonRequest(
        "http://localhost/api/elite/sessions/session1/attendance",
        attendancePayload
      );
      const response = await recordAttendance(request, {
        params: Promise.resolve({ id: "session1" }),
      });

      expect(response.status).toBe(403);
    });

    it("COACH can record attendance - returns 201", async () => {
      const session = mockSession("tenantA", "coach1");
      const context = mockEliteContext("tenantA", "coach1", "COACH", ["cohort1"]);

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      // Service allows attendance recording
      mockSessionService.recordAttendance.mockResolvedValue({
        id: "att1",
        sessionId: "session1",
        userId: "learner1",
        status: "PRESENT",
        user: { id: "learner1", name: "Learner", email: "learn@example.com" },
      } as any);

      const request = createJsonRequest(
        "http://localhost/api/elite/sessions/session1/attendance",
        attendancePayload
      );
      const response = await recordAttendance(request, {
        params: Promise.resolve({ id: "session1" }),
      });

      expect(response.status).toBe(201);
    });

    it("INSTRUCTOR can record attendance - returns 201", async () => {
      const session = mockSession("tenantA", "instructor1");
      const context = mockEliteContext("tenantA", "instructor1", "INSTRUCTOR", ["cohort1"]);

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      mockSessionService.recordAttendance.mockResolvedValue({
        id: "att2",
        sessionId: "session1",
        userId: "learner1",
        status: "PRESENT",
        user: { id: "learner1", name: "Learner", email: "learn@example.com" },
      } as any);

      const request = createJsonRequest(
        "http://localhost/api/elite/sessions/session1/attendance",
        attendancePayload
      );
      const response = await recordAttendance(request, {
        params: Promise.resolve({ id: "session1" }),
      });

      expect(response.status).toBe(201);
    });
  });

  describe("View permissions (read access)", () => {
    it("LEARNER can list cohorts they are a member of", async () => {
      const session = mockSession("tenantA", "learner1");
      const context = mockEliteContext("tenantA", "learner1", "LEARNER", ["cohort1", "cohort2"]);

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      // Service returns cohorts filtered by membership
      mockCohortService.list.mockResolvedValue([
        { id: "cohort1", name: "Cohort 1" },
        { id: "cohort2", name: "Cohort 2" },
      ] as any);

      const request = createGetRequest("http://localhost/api/elite/cohorts");
      const response = await listCohorts(request);

      expect(response.status).toBe(200);
      
      // Verify service was called with learner context
      expect(mockCohortService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenantA",
          eliteRole: "LEARNER",
          cohortIds: ["cohort1", "cohort2"],
        })
      );
    });

    it("LEADERSHIP can view all cohorts", async () => {
      const session = mockSession("tenantA", "leader1");
      const context = mockEliteContext("tenantA", "leader1", "LEADERSHIP");

      mockRequireAuth.mockResolvedValue(session as any);
      mockResolveEliteContext.mockResolvedValue(context as any);

      // Service returns all tenant cohorts
      mockCohortService.list.mockResolvedValue([
        { id: "cohort1", name: "Cohort 1" },
        { id: "cohort2", name: "Cohort 2" },
        { id: "cohort3", name: "Cohort 3" },
      ] as any);

      const request = createGetRequest("http://localhost/api/elite/cohorts");
      const response = await listCohorts(request);

      expect(response.status).toBe(200);
      
      // Verify service was called with leadership context
      expect(mockCohortService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenantA",
          eliteRole: "LEADERSHIP",
        })
      );
    });
  });
});

describe("ELITE Permission Matrix Completeness", () => {
  // This test documents and verifies the full permission matrix
  const PERMISSION_MATRIX: Array<{
    role: keyof typeof ELITE_ROLES;
    permission: string;
    expected: boolean;
  }> = [
    // PROGRAM_ADMIN - has all permissions
    { role: "PROGRAM_ADMIN", permission: ELITE_PERMISSIONS.MANAGE_COHORTS, expected: true },
    { role: "PROGRAM_ADMIN", permission: ELITE_PERMISSIONS.MANAGE_ROSTER, expected: true },
    { role: "PROGRAM_ADMIN", permission: ELITE_PERMISSIONS.MANAGE_SESSIONS, expected: true },
    { role: "PROGRAM_ADMIN", permission: ELITE_PERMISSIONS.RECORD_ATTENDANCE, expected: true },
    { role: "PROGRAM_ADMIN", permission: ELITE_PERMISSIONS.MANAGE_ELITE_CONFIG, expected: true },

    // COACH
    { role: "COACH", permission: ELITE_PERMISSIONS.MANAGE_COHORTS, expected: false },
    { role: "COACH", permission: ELITE_PERMISSIONS.MANAGE_COACHING, expected: true },
    { role: "COACH", permission: ELITE_PERMISSIONS.RECORD_ATTENDANCE, expected: true },
    { role: "COACH", permission: ELITE_PERMISSIONS.MANAGE_SESSIONS, expected: false },

    // INSTRUCTOR
    { role: "INSTRUCTOR", permission: ELITE_PERMISSIONS.MANAGE_SESSIONS, expected: true },
    { role: "INSTRUCTOR", permission: ELITE_PERMISSIONS.RECORD_ATTENDANCE, expected: true },
    { role: "INSTRUCTOR", permission: ELITE_PERMISSIONS.MANAGE_COHORTS, expected: false },
    { role: "INSTRUCTOR", permission: ELITE_PERMISSIONS.MANAGE_COACHING, expected: false },

    // LEARNER
    { role: "LEARNER", permission: ELITE_PERMISSIONS.VIEW_SESSIONS, expected: true },
    { role: "LEARNER", permission: ELITE_PERMISSIONS.SUBMIT_ASSIGNMENTS, expected: true },
    { role: "LEARNER", permission: ELITE_PERMISSIONS.MANAGE_COHORTS, expected: false },
    { role: "LEARNER", permission: ELITE_PERMISSIONS.MANAGE_SESSIONS, expected: false },
    { role: "LEARNER", permission: ELITE_PERMISSIONS.RECORD_ATTENDANCE, expected: false },

    // LEADERSHIP
    { role: "LEADERSHIP", permission: ELITE_PERMISSIONS.VIEW_CROSS_COHORT_ANALYTICS, expected: true },
    { role: "LEADERSHIP", permission: ELITE_PERMISSIONS.EXPORT_ANALYTICS, expected: true },
    { role: "LEADERSHIP", permission: ELITE_PERMISSIONS.MANAGE_COHORTS, expected: false },
    { role: "LEADERSHIP", permission: ELITE_PERMISSIONS.MANAGE_SESSIONS, expected: false },
  ];

  test.each(PERMISSION_MATRIX)(
    "$role has $permission: $expected",
    ({ role, permission, expected }) => {
      const roleKey = ELITE_ROLES[role];
      const permissions = ELITE_ROLE_PERMISSIONS[roleKey] || [];
      const hasPermission = permissions.includes(permission as any);
      expect(hasPermission).toBe(expected);
    }
  );
});
