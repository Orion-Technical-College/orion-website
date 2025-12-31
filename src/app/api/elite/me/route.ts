/**
 * GET /api/elite/me
 * 
 * Returns the resolved ELITE context for the current user.
 * This endpoint is critical for client-side UI composition.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveEliteContext } from "@/lib/elite/kernel/context";
import { resolveWorkspaceProfile } from "@/lib/workspace/resolver";
import type { EliteMeResponse } from "@/lib/elite/kernel/types";

export async function GET() {
  try {
    // 1. Require authentication
    const session = await requireAuth();

    // 2. Resolve ELITE context
    const ctx = await resolveEliteContext(session);
    if (!ctx) {
      return NextResponse.json(
        { error: "ELITE workspace access denied" },
        { status: 403 }
      );
    }

    // 3. Get org membership details
    const orgMemberships = await prisma.userOrgMembership.findMany({
      where: {
        clientId: ctx.tenantId,
        userId: ctx.userId,
        status: "ACTIVE",
      },
      include: {
        orgUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 4. Get cohort access details
    const cohortMemberships = await prisma.cohortMember.findMany({
      where: {
        clientId: ctx.tenantId,
        userId: ctx.userId,
        status: "ACTIVE",
      },
      include: {
        cohort: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 5. Get user details
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 6. Resolve workspace profile
    const workspaceProfile = await resolveWorkspaceProfile("ELITE", ctx);

    // 7. Build response
    type OrgMembershipResult = {
      orgUnit: { id: string; name: string };
      roleScope: string;
      isPrimary: boolean;
    };
    type CohortMembershipResult = {
      cohort: { id: string; name: string };
      role: string;
    };
    
    const response: EliteMeResponse = {
      tenantId: ctx.tenantId,
      tenantName: ctx.tenantName,
      
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      
      orgMemberships: (orgMemberships as OrgMembershipResult[]).map((m) => ({
        orgUnitId: m.orgUnit.id,
        orgUnitName: m.orgUnit.name,
        roleScope: m.roleScope as any,
        isPrimary: m.isPrimary,
      })),
      
      effectiveRole: ctx.eliteRole,
      effectivePermissions: ctx.effectivePermissions,
      
      cohortAccess: (cohortMemberships as CohortMembershipResult[]).map((m) => ({
        cohortId: m.cohort.id,
        cohortName: m.cohort.name,
        memberRole: m.role,
      })),
      
      featureFlags: {
        ELITE_GRAPH_ENABLED: ctx.featureFlags.ELITE_GRAPH_ENABLED ?? false,
        ELITE_ZOOM_ENABLED: ctx.featureFlags.ELITE_ZOOM_ENABLED ?? false,
        ELITE_ANALYTICS_ENABLED: ctx.featureFlags.ELITE_ANALYTICS_ENABLED ?? false,
      },
      
      workspaceProfile: workspaceProfile
        ? {
            id: workspaceProfile.id,
            version: workspaceProfile.version,
            modules: workspaceProfile.modules.map((m) => m.moduleKey),
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/elite/me] Error:", error);
    
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

