/**
 * Workspace Profile Resolver
 * 
 * Resolves the appropriate workspace profile version based on:
 * 1. tenant + orgUnit + role (most specific)
 * 2. tenant + orgUnit
 * 3. tenant default
 * 4. platform default fallback
 * 
 * Per ADR-001: Workspace Profiles + Module Registry
 */

import { prisma } from "@/lib/prisma";
import { moduleRegistry, type ModuleConfig, type ResolvedModule } from "@/lib/modules";
import type { EliteContext } from "@/lib/elite/kernel/types";
import type { ElitePermission } from "@/lib/elite/permissions";

/**
 * Resolved workspace profile
 */
export interface ResolvedWorkspaceProfile {
  /** Profile ID */
  id: string;
  /** Profile version ID */
  versionId: string;
  /** Version number */
  version: number;
  /** Workspace key (e.g., "ELITE") */
  workspaceKey: string;
  /** Profile name */
  name: string;
  /** Resolved modules for this user */
  modules: ResolvedModule[];
  /** Layout configuration */
  layoutConfig: Record<string, unknown> | null;
}

/**
 * Resolution parameters
 */
interface ResolutionParams {
  workspaceKey: string;
  tenantId: string | null;
  orgUnitId: string | null;
  roleScope: string | null;
}

/**
 * Resolve workspace profile for a given context
 * 
 * Resolution order (most specific to least specific):
 * 1. tenant + orgUnit + role
 * 2. tenant + orgUnit
 * 3. tenant default
 * 4. platform default
 */
export async function resolveWorkspaceProfile(
  workspaceKey: string,
  ctx: EliteContext
): Promise<ResolvedWorkspaceProfile | null> {
  // Find the most specific matching profile version
  const profileVersion = await findMostSpecificProfile({
    workspaceKey,
    tenantId: ctx.tenantId,
    orgUnitId: ctx.orgUnitId,
    roleScope: ctx.eliteRole,
  });

  if (!profileVersion) {
    return null;
  }

  // Parse module configuration
  let moduleConfigs: ModuleConfig[] = [];
  try {
    moduleConfigs = JSON.parse(profileVersion.modules) as ModuleConfig[];
  } catch (error) {
    console.error("[WorkspaceResolver] Failed to parse modules:", error);
  }

  // Parse layout configuration
  let layoutConfig: Record<string, unknown> | null = null;
  if (profileVersion.layoutConfig) {
    try {
      layoutConfig = JSON.parse(profileVersion.layoutConfig) as Record<string, unknown>;
    } catch (error) {
      console.error("[WorkspaceResolver] Failed to parse layoutConfig:", error);
    }
  }

  // Resolve modules based on user's permissions and feature flags
  const resolvedModules = moduleRegistry.resolveForProfile(
    moduleConfigs,
    ctx.effectivePermissions as ElitePermission[],
    ctx.featureFlags
  );

  return {
    id: profileVersion.profile.id,
    versionId: profileVersion.id,
    version: profileVersion.versionNumber,
    workspaceKey: profileVersion.profile.workspaceKey,
    name: profileVersion.profile.name,
    modules: resolvedModules,
    layoutConfig,
  };
}

/**
 * Find the most specific matching profile version
 */
async function findMostSpecificProfile(params: ResolutionParams) {
  const { workspaceKey, tenantId, orgUnitId, roleScope } = params;
  const now = new Date();

  // Try resolution in order of specificity
  const resolutionAttempts = [
    // 1. tenant + orgUnit + role
    tenantId && orgUnitId && roleScope
      ? {
          profile: {
            workspaceKey,
            clientId: tenantId,
          },
          orgUnitId,
          roleScope,
          status: "PUBLISHED",
          OR: [
            { effectiveFrom: null },
            { effectiveFrom: { lte: now } },
          ],
          AND: [
            {
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: now } },
              ],
            },
          ],
        }
      : null,

    // 2. tenant + orgUnit (any role)
    tenantId && orgUnitId
      ? {
          profile: {
            workspaceKey,
            clientId: tenantId,
          },
          orgUnitId,
          roleScope: null,
          status: "PUBLISHED",
          OR: [
            { effectiveFrom: null },
            { effectiveFrom: { lte: now } },
          ],
          AND: [
            {
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: now } },
              ],
            },
          ],
        }
      : null,

    // 3. tenant default (any orgUnit, any role)
    tenantId
      ? {
          profile: {
            workspaceKey,
            clientId: tenantId,
          },
          orgUnitId: null,
          roleScope: null,
          status: "PUBLISHED",
          OR: [
            { effectiveFrom: null },
            { effectiveFrom: { lte: now } },
          ],
          AND: [
            {
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: now } },
              ],
            },
          ],
        }
      : null,

    // 4. platform default
    {
      profile: {
        workspaceKey,
        clientId: null,
      },
      orgUnitId: null,
      roleScope: null,
      status: "PUBLISHED",
      OR: [
        { effectiveFrom: null },
        { effectiveFrom: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: now } },
          ],
        },
      ],
    },
  ].filter(Boolean);

  for (const where of resolutionAttempts) {
    if (!where) continue;

    const profileVersion = await prisma.workspaceProfileVersion.findFirst({
      where: where as any,
      orderBy: { versionNumber: "desc" },
      include: {
        profile: true,
      },
    });

    if (profileVersion) {
      return profileVersion;
    }
  }

  return null;
}

/**
 * Check if a user has access to a workspace
 * Returns true if a valid profile can be resolved
 */
export async function hasWorkspaceAccess(
  workspaceKey: string,
  ctx: EliteContext
): Promise<boolean> {
  const profile = await resolveWorkspaceProfile(workspaceKey, ctx);
  return profile !== null && profile.modules.length > 0;
}

/**
 * Get the default ELITE profile modules for seeding
 */
export function getDefaultEliteProfileModules(): ModuleConfig[] {
  return [
    { moduleKey: "elite.dashboard", order: 0 },
    { moduleKey: "elite.cohorts", order: 10 },
    { moduleKey: "elite.sessions", order: 20 },
    { moduleKey: "elite.coaching", order: 30 },
    { moduleKey: "elite.learnerProfiles", order: 35 },
    { moduleKey: "elite.assignments", order: 40 },
    { moduleKey: "elite.artifacts", order: 50 },
    { moduleKey: "elite.messaging", order: 60 },
    { moduleKey: "elite.tasks", order: 70 },
    { moduleKey: "elite.analytics", order: 80 },
    { moduleKey: "elite.admin", order: 100 },
  ];
}

