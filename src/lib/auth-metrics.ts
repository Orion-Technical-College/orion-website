/**
 * Lightweight authentication metrics
 * In-memory counters for v1 (can be moved to proper metrics system later)
 */

import { Role } from "./permissions";

interface Metrics {
  successfulLogins: Map<Role, number>;
  failedLogins: number;
  forbiddenActions: number;
}

const metrics: Metrics = {
  successfulLogins: new Map<Role, number>(),
  failedLogins: 0,
  forbiddenActions: 0,
};

/**
 * Record a successful login
 */
export function recordSuccessfulLogin(role: Role): void {
  const current = metrics.successfulLogins.get(role) || 0;
  metrics.successfulLogins.set(role, current + 1);
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(): void {
  metrics.failedLogins++;
}

/**
 * Record a forbidden action (RBAC denial)
 */
export function recordForbiddenAction(): void {
  metrics.forbiddenActions++;
}

/**
 * Get current metrics snapshot
 */
export function getMetrics(): {
  successfulLogins: Record<string, number>;
  failedLogins: number;
  forbiddenActions: number;
} {
  return {
    successfulLogins: Object.fromEntries(metrics.successfulLogins),
    failedLogins: metrics.failedLogins,
    forbiddenActions: metrics.forbiddenActions,
  };
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics(): void {
  metrics.successfulLogins.clear();
  metrics.failedLogins = 0;
  metrics.forbiddenActions = 0;
}

