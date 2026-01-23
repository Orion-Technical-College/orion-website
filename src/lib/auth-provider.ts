import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Role, ROLES } from "@/lib/permissions";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit-db";
import { logAction } from "@/lib/audit";
import { recordSuccessfulLogin, recordFailedLogin } from "@/lib/auth-metrics";
import { AuthError, AuthErrorType, classifyError } from "@/lib/auth-errors";
import { queryWithRetry } from "@/lib/db-retry";
import {
  logLoginSuccess,
  logLoginFailure,
  logRateLimitExceeded,
  logDatabaseError,
  logSystemError,
} from "@/lib/auth-logger";

/**
 * Pure functions extracted from NextAuth for better testability.
 * These can be tested directly without spinning up the entire NextAuth stack.
 */

export interface AuthorizeCredentialsParams {
  email: string;
  password: string;
  ip?: string;
}

export interface AuthorizeResult {
  id: string;
  email: string;
  name: string;
  role: string;
  clientId: string | null;
  isInternal: boolean;
  mustChangePassword: boolean;
}

/**
 * Authorize credentials (extracted from NextAuth CredentialsProvider).
 * Pure function that can be tested independently.
 */
export async function authorizeCredentials(
  params: AuthorizeCredentialsParams,
  prisma: PrismaClient
): Promise<AuthorizeResult | null> {
  const { email, password, ip } = params;

  if (!email || !password) {
    return null;
  }

  // Rate limiting by email
  const emailKey = `login:email:${email.toLowerCase()}`;
  const emailLimit = await checkRateLimit(emailKey, 5, 15 * 60 * 1000);
  if (!emailLimit.allowed) {
    // Log rate limit exceeded
    logRateLimitExceeded({
      email,
      ip,
      key: emailKey,
      resetAt: emailLimit.resetAt,
    });
    await logAction(
      {
        id: "system",
        email: "system",
        name: "System",
        role: ROLES.PLATFORM_ADMIN,
        clientId: null,
        isInternal: true,
      },
      "LOGIN_RATE_LIMIT_EXCEEDED",
      undefined,
      "User",
      { email, reason: "Too many failed attempts" }
    ).catch(() => { });
    recordFailedLogin();
    throw new Error(
      `Too many login attempts. Please try again after ${Math.ceil((emailLimit.resetAt - Date.now()) / 60000)} minutes.`
    );
  }

  // Rate limiting by IP (if available)
  if (ip && ip !== "unknown") {
    const ipKey = `login:ip:${ip}`;
    const ipLimit = await checkRateLimit(ipKey, 10, 15 * 60 * 1000); // More lenient for IP
    if (!ipLimit.allowed) {
      logRateLimitExceeded({
        ip,
        key: ipKey,
        resetAt: ipLimit.resetAt,
      });
      recordFailedLogin();
      throw new Error("Too many login attempts from this IP. Please try again later.");
    }
  }

  // Normalize email for case-insensitive lookup
  const normalizedEmail = email.toLowerCase().trim();

  // Standardized case-insensitive lookup using raw SQL with LOWER()
  // This ensures consistent behavior regardless of SQL Server collation settings
  // Wrapped in retry logic to handle transient database connection issues
  let user: {
    id: string;
    email: string;
    name: string;
    role: string;
    passwordHash: string | null;
    isActive: boolean;
    clientId: string | null;
    isInternal: boolean;
    mustChangePassword: boolean;
  } | null = null;

  try {
    const users = await queryWithRetry(
      () =>
        prisma.$queryRaw<Array<{
          id: string;
          email: string;
          name: string;
          role: string;
          passwordHash: string | null;
          isActive: boolean;
          clientId: string | null;
          isInternal: boolean;
          mustChangePassword: boolean | null;
        }>>`
          SELECT TOP 1 id, email, name, role, "passwordHash", "isActive", "clientId", "isInternal", "mustChangePassword"
          FROM "User"
          WHERE LOWER(email) = LOWER(${normalizedEmail})
        `,
      {
        maxRetries: 3,
        initialDelayMs: 1000,
      }
    );

    if (users.length > 0) {
      const rawUser = users[0];
      // Convert raw SQL result to match Prisma select type
      user = {
        id: rawUser.id,
        email: rawUser.email,
        name: rawUser.name,
        role: rawUser.role,
        passwordHash: rawUser.passwordHash,
        isActive: rawUser.isActive,
        clientId: rawUser.clientId,
        isInternal: rawUser.isInternal,
        mustChangePassword: rawUser.mustChangePassword ?? false,
      };
    }
  } catch (error: unknown) {
    // Database query failed after retries - classify and throw appropriate error
    const errorType = classifyError(error);
    const authError = new AuthError(
      errorType,
      `Database query failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined,
      { email: normalizedEmail, operation: "user_lookup" }
    );

    // Log database error
    if (error instanceof Error) {
      logDatabaseError({
        email: normalizedEmail,
        operation: "user_lookup",
        error,
        metadata: { errorType },
      });
    }

    throw authError;
  }

  if (!user) {
    // User not found - this is a valid authentication failure
    logLoginFailure({
      email,
      ip,
      reason: "User not found",
      errorType: AuthErrorType.INVALID_CREDENTIALS,
    });
    recordFailedLogin();
    await logAction(
      {
        id: "system",
        email: "system",
        name: "System",
        role: ROLES.PLATFORM_ADMIN,
        clientId: null,
        isInternal: true,
      },
      "LOGIN_FAILED",
      undefined,
      "User",
      { email, reason: "User not found" }
    ).catch(() => { });
    return null;
  }

  if (!user.passwordHash) {
    // User exists but has no password hash
    logLoginFailure({
      email,
      userId: user.id,
      ip,
      reason: "No password hash set",
      errorType: AuthErrorType.ACCOUNT_INACTIVE,
    });
    recordFailedLogin();
    await logAction(
      {
        id: "system",
        email: "system",
        name: "System",
        role: ROLES.PLATFORM_ADMIN,
        clientId: null,
        isInternal: true,
      },
      "LOGIN_FAILED",
      user.id,
      "User",
      { email, reason: "No password hash set" }
    ).catch(() => { });
    throw new AuthError(
      AuthErrorType.ACCOUNT_INACTIVE,
      "Account configuration error. Please contact support.",
      undefined,
      { userId: user.id, email }
    );
  }

  if (!user.isActive) {
    // User account is inactive
    logLoginFailure({
      email,
      userId: user.id,
      ip,
      reason: "Account inactive",
      errorType: AuthErrorType.ACCOUNT_INACTIVE,
    });
    recordFailedLogin();
    await logAction(
      {
        id: "system",
        email: "system",
        name: "System",
        role: ROLES.PLATFORM_ADMIN,
        clientId: null,
        isInternal: true,
      },
      "LOGIN_FAILED",
      user.id,
      "User",
      { email, reason: "Account inactive" }
    ).catch(() => { });
    throw new AuthError(
      AuthErrorType.ACCOUNT_INACTIVE,
      "Your account is inactive. Please contact support.",
      undefined,
      { userId: user.id, email }
    );
  }

  // Verify password with error handling
  let isValid: boolean;
  try {
    isValid = await bcrypt.compare(password, user.passwordHash);
  } catch (error: unknown) {
    // Password comparison failed (shouldn't happen, but handle gracefully)
    const errorType = classifyError(error);
    if (error instanceof Error) {
      logSystemError({
        email,
        operation: "password_verification",
        error,
        metadata: { userId: user.id },
      });
    }
    throw new AuthError(
      errorType,
      `Password verification failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined,
      { userId: user.id, email, operation: "password_verification" }
    );
  }

  if (!isValid) {
    // Invalid password - this is a valid authentication failure
    logLoginFailure({
      email,
      userId: user.id,
      ip,
      reason: "Invalid password",
      errorType: AuthErrorType.INVALID_CREDENTIALS,
    });
    recordFailedLogin();
    await logAction(
      {
        id: "system",
        email: "system",
        name: "System",
        role: ROLES.PLATFORM_ADMIN,
        clientId: null,
        isInternal: true,
      },
      "LOGIN_FAILED",
      user.id,
      "User",
      { email, reason: "Invalid password" }
    ).catch(() => { });
    return null;
  }

  // Clear rate limit on successful login
  await clearRateLimit(emailKey);
  if (ip && ip !== "unknown") {
    await clearRateLimit(`login:ip:${ip}`);
  }

  // Record successful login
  recordSuccessfulLogin(user.role as Role);

  // Log successful login with structured logging
  logLoginSuccess({
    userId: user.id,
    email: user.email,
    ip,
    role: user.role,
  });

  // Also log to audit log
  await logAction(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      clientId: user.clientId,
      isInternal: user.isInternal,
    },
    "LOGIN_SUCCESS",
    user.id,
    "User",
    { email: user.email }
  ).catch(() => { });

  // Return user data for JWT token
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
    isInternal: user.isInternal,
    mustChangePassword: user.mustChangePassword,
  };
}

export interface JWTToken {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  clientId?: string | null;
  isInternal?: boolean;
  mustChangePassword?: boolean;
  authProvider?: string;
  authProviderId?: string;
}

export interface JWTUser {
  id: string;
  email: string;
  name: string;
  role: string;
  clientId: string | null;
  isInternal: boolean;
  mustChangePassword?: boolean;
}

export interface JWTAccount {
  provider?: string;
}

export interface JWTProfile {
  sub?: string;
  oid?: string;
}

/**
 * JWT callback (extracted from NextAuth).
 * Pure function that can be tested independently.
 */
export function jwtCallback(params: {
  token: JWTToken;
  user?: JWTUser;
  account?: JWTAccount;
  profile?: JWTProfile;
}): JWTToken {
  const { token, user, account, profile } = params;

  // Initial sign in
  if (user) {
    token.id = user.id;
    token.email = user.email;
    token.name = user.name;
    token.role = user.role;
    token.clientId = user.clientId;
    token.isInternal = user.isInternal;
    token.mustChangePassword = user.mustChangePassword ?? false;

    // Map provider identity
    if (account?.provider === "azure-ad-b2c") {
      token.authProvider = "azureadb2c";
      token.authProviderId = profile?.sub ?? profile?.oid;
    } else {
      token.authProvider = "credentials";
      token.authProviderId = user.id;
    }
  }

  return token;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId: string | null;
  isInternal: boolean;
  mustChangePassword?: boolean;
}

export interface Session {
  user: SessionUser;
}

/**
 * Session callback (extracted from NextAuth).
 * Pure function that can be tested independently.
 */
export function sessionCallback(params: {
  session: Session;
  token: JWTToken;
}): Session {
  const { session, token } = params;

  // Ensure session.user exists and populate from token
  if (session.user && token) {
    // Only assign if token values are defined to avoid overwriting with undefined
    if (token.id) session.user.id = token.id;
    if (token.email) session.user.email = token.email;
    if (token.name) session.user.name = token.name;
    if (token.role) session.user.role = token.role as Role;
    session.user.clientId = token.clientId ?? null;
    session.user.isInternal = token.isInternal ?? false;
    session.user.mustChangePassword = token.mustChangePassword ?? false;
  }

  return session;
}

