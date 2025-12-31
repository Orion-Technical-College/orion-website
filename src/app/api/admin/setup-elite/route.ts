/**
 * POST /api/admin/setup-elite
 * Set up ELITE workspace access for a user
 * 
 * This endpoint creates the necessary client, org unit, and membership records
 * to give a user ELITE admin access.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

interface SetupEliteRequest {
  userEmail: string;
  clientName: string;
  clientDomain?: string;
  orgUnitName?: string;
  eliteRole?: string; // PROGRAM_ADMIN, COACH, INSTRUCTOR, LEARNER, LEADERSHIP
}

export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_SETUP_ELITE][${correlationId}] POST request`);

  try {
    const currentUser = await requireAuth();
    requireRole(currentUser, ROLES.PLATFORM_ADMIN);

    const body: SetupEliteRequest = await request.json();
    const { 
      userEmail, 
      clientName, 
      clientDomain,
      orgUnitName = "Leadership Programs",
      eliteRole = "PROGRAM_ADMIN"
    } = body;

    // Validation
    if (!userEmail || !clientName) {
      return NextResponse.json({
        success: false,
        error: { message: "userEmail and clientName are required" },
        correlationId,
      }, { status: 400 });
    }

    // Validate ELITE role
    const validRoles = ["PROGRAM_ADMIN", "COACH", "INSTRUCTOR", "LEARNER", "LEADERSHIP"];
    if (!validRoles.includes(eliteRole)) {
      return NextResponse.json({
        success: false,
        error: { message: `Invalid ELITE role. Must be one of: ${validRoles.join(", ")}` },
        correlationId,
      }, { status: 400 });
    }

    // Find the user
    const targetUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: { message: `User not found: ${userEmail}` },
        correlationId,
      }, { status: 404 });
    }

    // Step 1: Create or find the client
    let client = await prisma.client.findFirst({
      where: { name: clientName },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: clientName,
          domain: clientDomain || null,
          isActive: true,
        },
      });
      console.log(`[ADMIN_SETUP_ELITE][${correlationId}] Created client: ${clientName}`);
    } else {
      console.log(`[ADMIN_SETUP_ELITE][${correlationId}] Found existing client: ${clientName}`);
    }

    // Step 2: Update user's clientId if not set
    if (targetUser.clientId !== client.id) {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { clientId: client.id },
      });
      console.log(`[ADMIN_SETUP_ELITE][${correlationId}] Updated user clientId`);
    }

    // Step 3: Create or find the OrgUnit
    let orgUnit = await prisma.orgUnit.findFirst({
      where: {
        clientId: client.id,
        name: orgUnitName,
      },
    });

    if (!orgUnit) {
      orgUnit = await prisma.orgUnit.create({
        data: {
          clientId: client.id,
          name: orgUnitName,
        },
      });
      console.log(`[ADMIN_SETUP_ELITE][${correlationId}] Created OrgUnit: ${orgUnitName}`);
    } else {
      console.log(`[ADMIN_SETUP_ELITE][${correlationId}] Found existing OrgUnit: ${orgUnitName}`);
    }

    // Step 4: Create UserOrgMembership
    let membership = await prisma.userOrgMembership.findFirst({
      where: {
        clientId: client.id,
        userId: targetUser.id,
        orgUnitId: orgUnit.id,
      },
    });

    if (!membership) {
      membership = await prisma.userOrgMembership.create({
        data: {
          clientId: client.id,
          userId: targetUser.id,
          orgUnitId: orgUnit.id,
          roleScope: eliteRole,
          isPrimary: true,
          status: "ACTIVE",
        },
      });
      console.log(`[ADMIN_SETUP_ELITE][${correlationId}] Created membership with role: ${eliteRole}`);
    } else {
      // Update existing membership role
      membership = await prisma.userOrgMembership.update({
        where: { id: membership.id },
        data: {
          roleScope: eliteRole,
          status: "ACTIVE",
        },
      });
      console.log(`[ADMIN_SETUP_ELITE][${correlationId}] Updated existing membership to role: ${eliteRole}`);
    }

    // Step 5: Create a default WorkspaceProfile if it doesn't exist
    let workspaceProfile = await prisma.workspaceProfile.findFirst({
      where: {
        clientId: client.id,
        workspaceKey: "ELITE",
      },
    });

    if (!workspaceProfile) {
      workspaceProfile = await prisma.workspaceProfile.create({
        data: {
          clientId: client.id,
          workspaceKey: "ELITE",
          name: "ELITE Leadership Workspace",
          description: "Full ELITE workspace with all modules enabled",
        },
      });

      // Create initial version with all modules
      await prisma.workspaceProfileVersion.create({
        data: {
          clientId: client.id,
          profileId: workspaceProfile.id,
          versionNumber: 1,
          modules: JSON.stringify([
            "elite.dashboard",
            "elite.cohorts",
            "elite.sessions",
            "elite.coaching",
            "elite.learnerProfiles",
            "elite.assignments",
            "elite.artifacts",
            "elite.analytics",
            "elite.admin",
          ]),
          layoutConfig: JSON.stringify({
            theme: "default",
            navigation: "sidebar",
          }),
          status: "PUBLISHED",
          publishedBy: currentUser.id,
          publishedAt: new Date(),
          effectiveFrom: new Date(),
        },
      });
      console.log(`[ADMIN_SETUP_ELITE][${correlationId}] Created WorkspaceProfile for ELITE`);
    }

    // Step 6: Create a default ProgramTemplate if it doesn't exist
    let programTemplate = await prisma.programTemplate.findFirst({
      where: {
        clientId: client.id,
      },
    });

    if (!programTemplate) {
      programTemplate = await prisma.programTemplate.create({
        data: {
          clientId: client.id,
          name: "ELITE Leadership Fundamentals",
          description: "A comprehensive leadership development program covering core competencies, emotional intelligence, and strategic thinking.",
          status: "PUBLISHED",
        },
      });

      // Create initial version
      await prisma.programTemplateVersion.create({
        data: {
          clientId: client.id,
          templateId: programTemplate.id,
          versionNumber: 1,
          syllabus: JSON.stringify({
            modules: [
              { name: "Leadership Foundations", duration: "2 weeks" },
              { name: "Emotional Intelligence", duration: "2 weeks" },
              { name: "Strategic Thinking", duration: "2 weeks" },
              { name: "Team Leadership", duration: "2 weeks" },
            ],
            totalDuration: "8 weeks",
          }),
          status: "PUBLISHED",
          publishedBy: currentUser.id,
          publishedAt: new Date(),
          effectiveFrom: new Date(),
        },
      });
      console.log(`[ADMIN_SETUP_ELITE][${correlationId}] Created ProgramTemplate`);
    }

    // Audit log
    await logAction(
      currentUser,
      "ELITE_ACCESS_GRANTED",
      targetUser.id,
      "User",
      {
        userEmail,
        clientName,
        orgUnitName,
        eliteRole,
        correlationId,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
        },
        client: {
          id: client.id,
          name: client.name,
        },
        orgUnit: {
          id: orgUnit.id,
          name: orgUnit.name,
        },
        membership: {
          id: membership.id,
          roleScope: membership.roleScope,
          status: membership.status,
        },
        workspaceProfile: workspaceProfile ? {
          id: workspaceProfile.id,
          name: workspaceProfile.name,
        } : null,
        programTemplate: programTemplate ? {
          id: programTemplate.id,
          name: programTemplate.name,
        } : null,
      },
      message: `ELITE ${eliteRole} access granted to ${userEmail} for ${clientName}`,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_SETUP_ELITE][${correlationId}] Error:`, error);
    return NextResponse.json({
      success: false,
      error: {
        message: error.message || "Failed to set up ELITE access",
        details: error.code || undefined,
      },
      correlationId,
    }, { status: 500 });
  }
}

