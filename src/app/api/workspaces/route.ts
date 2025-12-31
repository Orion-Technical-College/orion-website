/**
 * GET /api/workspaces - Get available workspaces for the current user
 * 
 * Returns workspace options with richer naming per plan:
 * - platformName: The platform product name (e.g., "EMC Workspace")
 * - tenantName: The tenant/client name (e.g., "Orion Technical College")
 * - workspaceName: The display name for the workspace card
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/permissions";
import { WORKSPACE_KEYS, type WorkspaceKey } from "@/lib/workspace";

interface WorkspaceOption {
  id: string;
  key: WorkspaceKey;
  platformName: string;
  tenantName: string;
  workspaceName: string;
  description: string;
  icon: "users" | "graduation" | "chart" | "building" | "megaphone";
  href: string;
  color: string;
  available: boolean;
  badge?: string;
}

export async function GET() {
  try {
    const session = await requireAuth();
    
    const workspaces: WorkspaceOption[] = [];

    // Get the user's client (tenant) info if they have one
    let tenantName = "EMC Platform";
    let clientBadge: string | undefined;
    
    if (session.clientId) {
      try {
        const client = await prisma.client.findUnique({
          where: { id: session.clientId },
          select: { name: true },
        });
        if (client) {
          tenantName = client.name;
        }
      } catch {
        // Fallback to default name
      }

      // Check user's role for the tenant workspace badge
      if (session.role === ROLES.PLATFORM_ADMIN) {
        clientBadge = "Admin";
      } else if (session.role === ROLES.CLIENT_ADMIN) {
        clientBadge = "Admin";
      }
    }

    // Recruiter Workspace - the main EMC Recruiter workflow
    workspaces.push({
      id: "recruiter",
      key: WORKSPACE_KEYS.DEFAULT,
      platformName: "EMC Recruiter",
      tenantName: tenantName,
      workspaceName: "EMC Recruiter",
      description: "Recruiter workflow automation with AI-powered candidate management and SMS campaigns",
      icon: "users",
      href: "/recruiter",
      color: "cyan",
      available: true,
      badge: clientBadge,
    });

    // Marketing Workspace - SMS campaigns and marketing automation
    workspaces.push({
      id: "marketing",
      key: WORKSPACE_KEYS.MARKETING,
      platformName: "Marketing",
      tenantName: tenantName,
      workspaceName: "Marketing",
      description: "SMS campaigns, email marketing, and outreach automation",
      icon: "chart", // Using chart instead of megaphone temporarily
      href: "/marketing",
      color: "emerald",
      available: true,
      badge: clientBadge,
    });

    // ELITE Workspace - available to users with org memberships
    if (session.clientId) {
      let hasEliteAccess = false;
      let eliteBadge: string | undefined;

      try {
        // Check if user has any ELITE org memberships
        const orgMemberships = await prisma.userOrgMembership.findMany({
          where: {
            userId: session.id,
            clientId: session.clientId,
            status: "ACTIVE",
          },
          select: {
            roleScope: true,
          },
        });

        if (orgMemberships.length > 0) {
          hasEliteAccess = true;
          
          // Determine badge based on role
          const roles = orgMemberships.map((m: { roleScope: string }) => m.roleScope);
          if (roles.includes("PROGRAM_ADMIN")) {
            eliteBadge = "Admin";
          } else if (roles.includes("LEADERSHIP")) {
            eliteBadge = "Leadership";
          } else if (roles.includes("COACH") || roles.includes("INSTRUCTOR")) {
            eliteBadge = "Staff";
          } else if (roles.includes("LEARNER")) {
            eliteBadge = "Learner";
          }
        }
      } catch {
        // If the table doesn't exist yet, check for basic tenant access
        hasEliteAccess = true;
        eliteBadge = "New";
      }

      workspaces.push({
        id: "elite",
        key: WORKSPACE_KEYS.ELITE,
        platformName: "ELITE Leadership",
        tenantName: tenantName,
        workspaceName: "ELITE Leadership",
        description: "Cohort operations, learner engagement, coaching, and outcomes analytics",
        icon: "graduation",
        href: "/elite",
        color: "purple",
        available: hasEliteAccess,
        badge: eliteBadge,
      });
    } else {
      // Show ELITE as unavailable for users without tenant
      workspaces.push({
        id: "elite",
        key: WORKSPACE_KEYS.ELITE,
        platformName: "ELITE Leadership",
        tenantName: tenantName,
        workspaceName: "ELITE Leadership",
        description: "Cohort operations, learner engagement, coaching, and outcomes analytics",
        icon: "graduation",
        href: "/elite",
        color: "purple",
        available: false,
      });
    }

    // Platform Admin workspace - only for platform admins
    if (session.role === ROLES.PLATFORM_ADMIN) {
      workspaces.push({
        id: "admin",
        key: WORKSPACE_KEYS.DEFAULT,
        platformName: "Platform Admin",
        tenantName: "EMC Platform",
        workspaceName: "Platform Admin",
        description: "System administration, user management, and platform configuration",
        icon: "chart",
        href: "/admin",
        color: "amber",
        available: true,
        badge: "Admin",
      });
    }

    // Return with no-cache headers to ensure fresh data on each request
    return NextResponse.json(
      { workspaces },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/workspaces] Error:", error);
    
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
