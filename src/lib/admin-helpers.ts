import { prisma } from "@/lib/prisma";
import { ROLES } from "./permissions";
import type { SessionUser } from "@/types/auth";
import type { User, Client } from "@prisma/client";

// Note: Platform Admins bypass tenant isolation - this function returns empty object for them

/**
 * Returns empty where clause for Platform Admins (bypasses tenant isolation).
 * For non-admin queries, use tenantWhere() instead.
 */
export function adminWhere(user: SessionUser): Record<string, any> {
  if (user.role === ROLES.PLATFORM_ADMIN) {
    return {}; // Platform Admins see all data
  }
  // This function should only be called for admin operations
  // For regular operations, use tenantWhere() instead
  throw new Error("adminWhere() should only be used for Platform Admin operations");
}

/**
 * Check if a user can be deleted (soft delete).
 * Returns true if user has no active campaigns or critical dependencies.
 */
export async function canDeleteUser(
  user: User,
  currentUser: SessionUser
): Promise<{ canDelete: boolean; reason?: string }> {
  // Platform Admins can always delete (with validation)
  if (currentUser.role !== ROLES.PLATFORM_ADMIN) {
    return { canDelete: false, reason: "Only Platform Admins can delete users" };
  }

  // Cannot delete yourself
  if (user.id === currentUser.id) {
    return { canDelete: false, reason: "Cannot delete your own account" };
  }

  // Check for active campaigns
  const activeCampaigns = await prisma.campaign.count({
    where: {
      userId: user.id,
      status: { in: ["DRAFT", "ACTIVE"] },
    },
  });

  if (activeCampaigns > 0) {
    return {
      canDelete: false,
      reason: `User has ${activeCampaigns} active campaign(s). Please complete or cancel campaigns before deleting.`,
    };
  }

  // Check if user is managing candidates
  const managedCandidates = await prisma.candidate.count({
    where: {
      recruiterId: user.id,
    },
  });

  if (managedCandidates > 0) {
    // Allow deletion but log warning
    return { canDelete: true }; // Soft delete is safe, candidates will remain
  }

  return { canDelete: true };
}

/**
 * Check if a client can be deleted (soft delete).
 * Returns true if client has no active users or candidates.
 */
export async function canDeleteClient(
  client: Client,
  currentUser: SessionUser
): Promise<{ canDelete: boolean; reason?: string; details?: { users: number; candidates: number } }> {
  // Platform Admins can always delete (with validation)
  if (currentUser.role !== ROLES.PLATFORM_ADMIN) {
    return { canDelete: false, reason: "Only Platform Admins can delete clients" };
  }

  // Count active users (excluding soft-deleted)
  // Note: deletedAt field will be available after migration
  const activeUsers = await prisma.user.count({
    where: {
      clientId: client.id,
    },
  });

  // Count candidates
  const candidates = await prisma.candidate.count({
    where: {
      clientId: client.id,
    },
  });

  if (activeUsers > 0 || candidates > 0) {
    return {
      canDelete: false,
      reason: "Cannot delete client with active users or candidates",
      details: {
        users: activeUsers,
        candidates,
      },
    };
  }

  return { canDelete: true };
}

// In-memory cache for system settings (refresh on update)
let systemSettingsCache: Map<string, { value: string; isEnabled: boolean; updatedAt: Date }> = new Map();
let cacheExpiry: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Get system setting from database (with caching).
 * Falls back to environment variable if not in database.
 */
export async function getSystemSetting(key: string): Promise<boolean> {
  // Check cache first
  const now = Date.now();
  if (now < cacheExpiry) {
    const cached = systemSettingsCache.get(key);
    if (cached) {
      return cached.isEnabled;
    }
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (setting) {
      // Update cache
      systemSettingsCache.set(key, {
        value: setting.value,
        isEnabled: setting.isEnabled,
        updatedAt: setting.updatedAt,
      });
      cacheExpiry = now + CACHE_TTL;
      return setting.isEnabled;
    }

    // Fall back to environment variable
    const envValue = process.env[key];
    if (envValue !== undefined) {
      return envValue !== "false";
    }

    // Default to true if not found
    return true;
  } catch (error) {
    console.error(`[ADMIN_HELPERS] Error getting system setting ${key}:`, error);
    // Fall back to environment variable on error
    const envValue = process.env[key];
    return envValue !== "false";
  }
}

/**
 * Update system setting in database and invalidate cache.
 */
export async function setSystemSetting(
  key: string,
  isEnabled: boolean,
  updatedBy: string,
  description?: string
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: {
      isEnabled,
      value: isEnabled ? "true" : "false",
      description,
      updatedBy,
      updatedAt: new Date(),
    },
    create: {
      key,
      value: isEnabled ? "true" : "false",
      isEnabled,
      description: description || `Feature flag for ${key}`,
      updatedBy,
    },
  });

  // Invalidate cache
  systemSettingsCache.delete(key);
  cacheExpiry = 0;
}

/**
 * Clear system settings cache (useful for testing or manual refresh).
 */
export function clearSystemSettingsCache(): void {
  systemSettingsCache.clear();
  cacheExpiry = 0;
}
