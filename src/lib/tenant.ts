import { Role, ROLES } from "./permissions";
import { SessionUser } from "@/types/auth";
import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";
import { logAction } from "./audit";

/**
 * Returns Prisma where clause for tenant-scoped queries.
 * Platform Admins and Recruiters get global scope (empty where).
 * All other roles must have clientId and are scoped to that client.
 */
export function tenantWhere(user: SessionUser): Record<string, any> {
  if (user.role === ROLES.PLATFORM_ADMIN || user.role === ROLES.RECRUITER) {
    return {}; // global scope
  }

  if (!user.clientId) {
    // Log tenant violation
    logAction(
      user,
      "TENANT_VIOLATION",
      user.id,
      "User",
      { reason: "Tenant scoped user missing clientId", role: user.role }
    ).catch(() => {});
    throw new Error(`Tenant scoped user (${user.role}) missing clientId`);
  }

  return { clientId: user.clientId };
}

/**
 * Find many candidates with automatic tenant filtering
 */
export function findManyCandidates(
  user: SessionUser,
  where: Prisma.CandidateWhereInput = {}
) {
  return prisma.candidate.findMany({
    where: {
      ...tenantWhere(user),
      ...where,
    },
  });
}

/**
 * Find many campaigns with automatic tenant filtering
 * Note: Campaigns are not directly tenant-scoped, but they reference tenant-scoped candidates
 */
export function findManyCampaigns(
  user: SessionUser,
  where: Prisma.CampaignWhereInput = {}
) {
  // For campaigns, we need to filter by the candidates they reference
  // This is a simplified version - you may need to adjust based on your schema
  const tenantFilter = tenantWhere(user);
  
  if (Object.keys(tenantFilter).length === 0) {
    // Global scope - return all campaigns
    return prisma.campaign.findMany({ where });
  }

  // For tenant-scoped users, we'd need to join with candidates
  // For now, return campaigns created by the user (simplified)
  return prisma.campaign.findMany({
    where: {
      ...where,
      userId: user.id, // Simplified: user can only see their own campaigns
    },
  });
}

/**
 * Validate that a user can access a resource belonging to a specific client
 */
export function validateTenantScope(
  user: SessionUser,
  resourceClientId: string | null
): void {
  if (user.role === ROLES.PLATFORM_ADMIN || user.role === ROLES.RECRUITER) {
    return; // Global scope
  }

  if (user.clientId !== resourceClientId) {
    // Log tenant violation
    logAction(
      user,
      "TENANT_VIOLATION",
      resourceClientId || undefined,
      "Resource",
      { 
        reason: "Access denied: resource belongs to different tenant",
        userClientId: user.clientId,
        resourceClientId 
      }
    ).catch(() => {});
    throw new Error("Access denied: resource belongs to different tenant");
  }
}

