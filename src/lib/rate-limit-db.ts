/**
 * Persistent rate limiting using database
 * Replaces in-memory rate limiting for production reliability
 */

import { prisma } from "@/lib/prisma";
import { queryWithRetry } from "@/lib/db-retry";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key using database
 * @param key - Unique identifier (e.g., email or IP address)
 * @param maxAttempts - Maximum attempts allowed (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns Rate limit result with allowed status and remaining attempts
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<RateLimitResult> {
  // If maxAttempts is 0 or negative, always deny
  if (maxAttempts <= 0) {
    return { allowed: false, remaining: 0, resetAt: Date.now() + windowMs };
  }

  const now = Date.now();
  const resetAt = new Date(now + windowMs);

  try {
    // Use retry logic for database operations
    const record = await queryWithRetry(async () => {
      // Try to find existing record
      return await prisma.rateLimit.findUnique({
        where: { key },
      });
    });

    // Clean up expired records
    if (record && record.resetAt < new Date(now)) {
      // Record expired, delete it and create new one
      await queryWithRetry(async () => {
        await prisma.rateLimit.delete({
          where: { key },
        });
      }).catch(() => {
        // Ignore delete errors (record may have been deleted by another process)
      });

      // Create new record
      await queryWithRetry(async () => {
        await prisma.rateLimit.create({
          data: {
            key,
            count: 1,
            resetAt,
          },
        });
      });

      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt: resetAt.getTime(),
      };
    }

    if (!record) {
      // No record exists, create new one
      await queryWithRetry(async () => {
        await prisma.rateLimit.create({
          data: {
            key,
            count: 1,
            resetAt,
          },
        });
      });

      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt: resetAt.getTime(),
      };
    }

    // Record exists and is still valid
    if (record.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt.getTime(),
      };
    }

    // Increment count
    const updated = await queryWithRetry(async () => {
      return await prisma.rateLimit.update({
        where: { key },
        data: {
          count: record.count + 1,
          updatedAt: new Date(),
        },
      });
    });

    return {
      allowed: true,
      remaining: maxAttempts - updated.count,
      resetAt: updated.resetAt.getTime(),
    };
  } catch (error) {
    // If database operation fails, fall back to allowing the request
    // This prevents database issues from blocking all authentication
    console.error("[RateLimit] Database error, allowing request:", error);
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: resetAt.getTime(),
    };
  }
}

/**
 * Clear rate limit for a key (useful for testing or manual unlock)
 */
export async function clearRateLimit(key: string): Promise<void> {
  try {
    await queryWithRetry(async () => {
      await prisma.rateLimit.delete({
        where: { key },
      }).catch(() => {
        // Ignore if record doesn't exist
      });
    });
  } catch (error) {
    // Log but don't throw - clearing rate limit is not critical
    console.error("[RateLimit] Error clearing rate limit:", error);
  }
}

/**
 * Clean up expired rate limit records
 * Should be run periodically (e.g., via cron job)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  try {
    const now = new Date();
    const result = await queryWithRetry(async () => {
      return await prisma.rateLimit.deleteMany({
        where: {
          resetAt: {
            lt: now,
          },
        },
      });
    });
    return result.count;
  } catch (error) {
    console.error("[RateLimit] Error cleaning up expired records:", error);
    return 0;
  }
}
