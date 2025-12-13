import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { SessionUser } from "@/types/auth";
import { Role, ROLES, PERMISSIONS, hasPermission, isValidRole } from "./permissions";
import { recordForbiddenAction } from "./auth-metrics";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }

  // Validate role from session
  if (!isValidRole(session.user.role)) {
    console.error("Invalid role in session:", session.user.role);
    return null;
  }

  return session.user;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export function requireRole(user: SessionUser, role: Role): void {
  if (user.role !== role) {
    throw new Error(`Role ${role} required`);
  }
}

export function requireAnyRole(user: SessionUser, roles: Role[]): void {
  if (!roles.includes(user.role)) {
    throw new Error(`One of roles ${roles.join(", ")} required`);
  }
}

export function requirePermission(user: SessionUser, permission: string): void {
  if (!hasPermission(user.role, permission)) {
    recordForbiddenAction();
    throw new Error(`Permission ${permission} required`);
  }
}

export function canManageUser(targetUser: SessionUser, currentUser: SessionUser): boolean {
  // Platform Admin can manage anyone
  if (currentUser.role === ROLES.PLATFORM_ADMIN) {
    return true;
  }

  // Client Admin can manage Client Users in their client
  if (currentUser.role === ROLES.CLIENT_ADMIN) {
    return (
      targetUser.role === ROLES.CLIENT_USER &&
      targetUser.clientId === currentUser.clientId
    );
  }

  return false;
}

export function canAccessClient(clientId: string | null, user: SessionUser): boolean {
  // Platform Admin and Recruiters can access all clients
  if (user.role === ROLES.PLATFORM_ADMIN || user.role === ROLES.RECRUITER) {
    return true;
  }

  // Others can only access their own client
  return user.clientId === clientId;
}

