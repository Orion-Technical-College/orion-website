/**
 * Structured logging for authentication events
 * Provides consistent logging format for monitoring and debugging
 */

import { AuthErrorType } from "./auth-errors";

export interface AuthLogEntry {
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  email?: string;
  userId?: string;
  ip?: string;
  errorType?: AuthErrorType;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log authentication event with structured data
 */
export function logAuthEvent(entry: Omit<AuthLogEntry, "timestamp">): void {
  const logEntry: AuthLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // In production, this should send to Application Insights or similar
  // For now, use console with structured format
  const logMessage = JSON.stringify(logEntry);

  switch (entry.level) {
    case "error":
      console.error(`[Auth] ${logMessage}`);
      break;
    case "warn":
      console.warn(`[Auth] ${logMessage}`);
      break;
    case "info":
    default:
      console.log(`[Auth] ${logMessage}`);
      break;
  }

  // Optional: server-only sink (e.g. Application Insights) when registered
  if (_authLogSink) {
    try {
      _authLogSink(entry);
    } catch {
      // Sink failed; skip
    }
  }
}

export type AuthLogSink = (entry: Omit<AuthLogEntry, "timestamp">) => void;
let _authLogSink: AuthLogSink | null = null;

/**
 * Register a sink for auth events (e.g. Application Insights). Only call from server-side code.
 */
export function setAuthLogSink(sink: AuthLogSink | null): void {
  _authLogSink = sink;
}

/**
 * Log successful login
 */
export function logLoginSuccess(params: {
  userId: string;
  email: string;
  ip?: string;
  role?: string;
}): void {
  logAuthEvent({
    event: "LOGIN_SUCCESS",
    level: "info",
    email: params.email,
    userId: params.userId,
    ip: params.ip,
    message: `User ${params.email} logged in successfully`,
    metadata: {
      role: params.role,
    },
  });
}

/**
 * Log failed login attempt
 */
export function logLoginFailure(params: {
  email: string;
  userId?: string;
  ip?: string;
  reason: string;
  errorType?: AuthErrorType;
  metadata?: Record<string, unknown>;
}): void {
  logAuthEvent({
    event: "LOGIN_FAILED",
    level: "warn",
    email: params.email,
    userId: params.userId,
    ip: params.ip,
    errorType: params.errorType,
    message: `Login failed for ${params.email}: ${params.reason}`,
    metadata: params.metadata,
  });
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(params: {
  email?: string;
  ip?: string;
  key: string;
  resetAt: number;
}): void {
  logAuthEvent({
    event: "RATE_LIMIT_EXCEEDED",
    level: "warn",
    email: params.email,
    ip: params.ip,
    message: `Rate limit exceeded for ${params.key}`,
    metadata: {
      key: params.key,
      resetAt: new Date(params.resetAt).toISOString(),
    },
  });
}

/**
 * Log database error during authentication
 */
export function logDatabaseError(params: {
  email: string;
  operation: string;
  error: Error;
  metadata?: Record<string, unknown>;
}): void {
  logAuthEvent({
    event: "DATABASE_ERROR",
    level: "error",
    email: params.email,
    errorType: AuthErrorType.DATABASE_ERROR,
    message: `Database error during ${params.operation}: ${params.error.message}`,
    metadata: {
      operation: params.operation,
      errorMessage: params.error.message,
      errorStack: params.error.stack,
      ...params.metadata,
    },
  });
}

/**
 * Log session missing / redirect to login (for diagnosing intermittent session drops).
 * No PII (no userId/email when session is missing).
 */
export function logSessionMissing(params: {
  source: "middleware" | "server" | "client" | "api";
  path?: string;
  route?: string;
  message: string;
  metadata?: Record<string, unknown>;
}): void {
  logAuthEvent({
    event: "SESSION_MISSING",
    level: "warn",
    message: params.message,
    metadata: {
      source: params.source,
      ...(params.path != null && { path: params.path }),
      ...(params.route != null && { route: params.route }),
      ...params.metadata,
    },
  });
}

/**
 * Log system error during authentication
 */
export function logSystemError(params: {
  email?: string;
  operation: string;
  error: Error;
  metadata?: Record<string, unknown>;
}): void {
  logAuthEvent({
    event: "SYSTEM_ERROR",
    level: "error",
    email: params.email,
    errorType: AuthErrorType.SYSTEM_ERROR,
    message: `System error during ${params.operation}: ${params.error.message}`,
    metadata: {
      operation: params.operation,
      errorMessage: params.error.message,
      errorStack: params.error.stack,
      ...params.metadata,
    },
  });
}
