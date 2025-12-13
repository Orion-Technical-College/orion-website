/**
 * Rate limiting for authentication endpoints
 * In-memory store for v1 (can be moved to Redis or database later)
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store (lost on server restart - acceptable for v1)
const store: RateLimitStore = {};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (e.g., email or IP address)
 * @param maxAttempts - Maximum attempts allowed (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns Rate limit result with allowed status and remaining attempts
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): RateLimitResult {
  // If maxAttempts is 0 or negative, always deny
  if (maxAttempts <= 0) {
    return { allowed: false, remaining: 0, resetAt: Date.now() + windowMs };
  }

  const now = Date.now();
  const record = store[key];

  if (!record || record.resetAt < now) {
    // Reset or create new record
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Clear rate limit for a key (useful for testing or manual unlock)
 */
export function clearRateLimit(key: string): void {
  delete store[key];
}

