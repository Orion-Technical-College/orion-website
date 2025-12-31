/**
 * ELITE Context Resolver
 * 
 * Resolves the EliteContext for a user based on their session.
 * This is the entry point for all ELITE authorization decisions.
 */

import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";
import type { EliteContext } from "./types";
import { 
  ELITE_ROLES, 
  type EliteRole, 
  isValidEliteRole, 
  getElitePermissions 
} from "../permissions";

/**
 * Role priority for determining effective role when user has multiple memberships
 * Higher number = higher privilege
 */
const ROLE_PRIORITY: Record<EliteRole, number> = {
  [ELITE_ROLES.PROGRAM_ADMIN]: 5,
  [ELITE_ROLES.LEADERSHIP]: 4,
  [ELITE_ROLES.INSTRUCTOR]: 3,
  [ELITE_ROLES.COACH]: 2,
  [ELITE_ROLES.LEARNER]: 1,
};

/**
 * Resolve ELITE context for a user
 * Returns null if the user doesn't have ELITE workspace access
 */
export async function resolveEliteContext(
  session: SessionUser
): Promise<EliteContext | null> {
  // User must have a client (tenant) to access ELITE
  if (!session.clientId) {
    return null;
  }

  // Fetch user's org memberships and cohort memberships
  const [client, orgMemberships, cohortMemberships, featureFlags] = await Promise.all([
    prisma.client.findUnique({
      where: { id: session.clientId },
      select: { id: true, name: true },
    }),
    prisma.userOrgMembership.findMany({
      where: {
        clientId: session.clientId,
        userId: session.id,
        status: "ACTIVE",
      },
      select: {
        orgUnitId: true,
        roleScope: true,
        isPrimary: true,
      },
    }),
    prisma.cohortMember.findMany({
      where: {
        clientId: session.clientId,
        userId: session.id,
        status: "ACTIVE",
      },
      select: {
        cohortId: true,
      },
    }),
    getFeatureFlags(session.clientId),
  ]);

  // User must have at least one org membership to access ELITE
  if (!client || orgMemberships.length === 0) {
    return null;
  }

  // Determine effective role (highest privilege)
  let effectiveRole: EliteRole = ELITE_ROLES.LEARNER;
  let primaryOrgUnitId: string | null = null;

  for (const membership of orgMemberships) {
    if (!isValidEliteRole(membership.roleScope)) {
      continue;
    }

    const role = membership.roleScope as EliteRole;
    if (ROLE_PRIORITY[role] > ROLE_PRIORITY[effectiveRole]) {
      effectiveRole = role;
    }

    if (membership.isPrimary) {
      primaryOrgUnitId = membership.orgUnitId;
    }
  }

  // If no primary set, use first org unit
  if (!primaryOrgUnitId && orgMemberships.length > 0) {
    primaryOrgUnitId = orgMemberships[0].orgUnitId;
  }

  const context: EliteContext = {
    tenantId: session.clientId,
    tenantName: client.name,
    userId: session.id,
    orgUnitId: primaryOrgUnitId,
    orgUnitIds: orgMemberships.map((m: { orgUnitId: string }) => m.orgUnitId),
    eliteRole: effectiveRole,
    effectivePermissions: getElitePermissions(effectiveRole),
    cohortIds: cohortMemberships.map((m: { cohortId: string }) => m.cohortId),
    featureFlags,
  };

  return context;
}

/**
 * Get feature flags for a tenant
 */
async function getFeatureFlags(
  clientId: string
): Promise<Record<string, boolean>> {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        startsWith: "ELITE_",
      },
    },
    select: {
      key: true,
      isEnabled: true,
    },
  });

  const flags: Record<string, boolean> = {
    ELITE_GRAPH_ENABLED: false,
    ELITE_ZOOM_ENABLED: false,
  };

  for (const setting of settings) {
    flags[setting.key] = setting.isEnabled;
  }

  return flags;
}

/**
 * Require ELITE context - throws if not available
 */
export async function requireEliteContext(
  session: SessionUser
): Promise<EliteContext> {
  const context = await resolveEliteContext(session);
  if (!context) {
    throw new Error("ELITE workspace access denied");
  }
  return context;
}

