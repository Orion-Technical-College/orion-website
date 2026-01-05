import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Role, ROLES } from "@/lib/permissions";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";
import { recordSuccessfulLogin, recordFailedLogin } from "@/lib/auth-metrics";

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
  const emailLimit = checkRateLimit(emailKey, 5, 15 * 60 * 1000);
  if (!emailLimit.allowed) {
    // Log failed attempt
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
    ).catch(() => {});
    recordFailedLogin();
    throw new Error(
      `Too many login attempts. Please try again after ${Math.ceil((emailLimit.resetAt - Date.now()) / 60000)} minutes.`
    );
  }

  // Rate limiting by IP (if available)
  if (ip && ip !== "unknown") {
    const ipKey = `login:ip:${ip}`;
    const ipLimit = checkRateLimit(ipKey, 10, 15 * 60 * 1000); // More lenient for IP
    if (!ipLimit.allowed) {
      recordFailedLogin();
      throw new Error("Too many login attempts from this IP. Please try again later.");
    }
  }

  // Normalize email for case-insensitive lookup
  const normalizedEmail = email.toLowerCase().trim();
  
  // Try exact match first, then case-insensitive fallback
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      isActive: true,
      clientId: true,
      isInternal: true,
      mustChangePassword: true,
    },
  });
  
  // If not found with normalized email, try original (for backwards compatibility)
  if (!user) {
    user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        isActive: true,
        clientId: true,
        isInternal: true,
        mustChangePassword: true,
      },
    });
  }

  if (!user || !user.passwordHash || !user.isActive) {
    // Log failed attempt
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
      user?.id,
      "User",
      { email, reason: "Invalid credentials or inactive account" }
    ).catch(() => {});
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    // Log failed attempt
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
    ).catch(() => {});
    return null;
  }

  // Clear rate limit on successful login
  clearRateLimit(emailKey);
  if (ip && ip !== "unknown") {
    clearRateLimit(`login:ip:${ip}`);
  }

  // Record successful login
  recordSuccessfulLogin(user.role as Role);

  // Log successful login
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
  ).catch(() => {});

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
    console.log("[JWT] Creating token for user:", user.email);
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
    
    console.log("[JWT] Token created successfully");
  } else {
    console.log("[JWT] No user provided, returning existing token");
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

  if (session.user) {
    console.log("[Session] Creating session for:", token.email);
    session.user.id = token.id as string;
    session.user.email = token.email as string;
    session.user.name = token.name as string;
    session.user.role = token.role as Role;
    session.user.clientId = (token.clientId as string | null) ?? null;
    session.user.isInternal = (token.isInternal as boolean) ?? false;
    session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
    console.log("[Session] Session created successfully");
  } else {
    console.log("[Session] No session.user found");
  }

  return session;
}

