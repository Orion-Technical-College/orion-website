import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES, isValidRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { canDeleteUser } from "@/lib/admin-helpers";
import { logAction } from "@/lib/audit";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/users/[id]
 * Update a user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = randomUUID();
  const userId = params.id;
  console.log(`[ADMIN_USERS][${correlationId}] PATCH request for user ${userId}`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    const body = await request.json();
    const { role, clientId, isActive, name } = body;

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser || (existingUser as any).deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "User not found" },
          correlationId,
        },
        { status: 404 }
      );
    }

    // Validate role if provided
    if (role && !isValidRole(role)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid role" },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Check for dependencies if changing role
    if (role && role !== existingUser.role) {
      const activeCampaigns = await prisma.campaign.count({
        where: {
          userId: existingUser.id,
          status: { in: ["DRAFT", "ACTIVE"] },
        },
      });

      if (activeCampaigns > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `Cannot change role: user has ${activeCampaigns} active campaign(s)`,
            },
            correlationId,
          },
          { status: 400 }
        );
      }
    }

    // Validate client assignment
    if (role === ROLES.CLIENT_ADMIN || role === ROLES.CLIENT_USER) {
      const finalRole = role || existingUser.role;
      const finalClientId = clientId !== undefined ? clientId : existingUser.clientId;

      if (!finalClientId) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Client assignment is required for CLIENT_ADMIN and CLIENT_USER roles" },
            correlationId,
          },
          { status: 400 }
        );
      }

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: finalClientId },
      });

      if (!client || client.deletedAt) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Invalid client" },
            correlationId,
          },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(clientId !== undefined && { clientId: role === ROLES.CLIENT_ADMIN || role === ROLES.CLIENT_USER ? clientId : null }),
        ...(isActive !== undefined && { isActive }),
        isInternal: role ? (role === ROLES.PLATFORM_ADMIN || role === ROLES.RECRUITER) : existingUser.isInternal,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        mustChangePassword: true,
        authProvider: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    // Audit log
    await logAction(
      user,
      "USER_UPDATED",
      userId,
      "User",
      {
        changes: {
          role: role || existingUser.role,
          clientId: clientId !== undefined ? clientId : existingUser.clientId,
          isActive: isActive !== undefined ? isActive : existingUser.isActive,
        },
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      data: updatedUser,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_USERS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to update user",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Soft delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = randomUUID();
  const userId = params.id;
  console.log(`[ADMIN_USERS][${correlationId}] DELETE request for user ${userId}`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "User not found" },
          correlationId,
        },
        { status: 404 }
      );
    }

    if ((existingUser as any).deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "User is already deleted" },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Check if user can be deleted
    const deleteCheck = await canDeleteUser(existingUser, user);
    if (!deleteCheck.canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: deleteCheck.reason || "Cannot delete user",
          },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.$executeRaw`
      UPDATE [User] 
      SET deletedAt = GETDATE(), isActive = 0 
      WHERE id = ${userId}
    `;

    // Fetch updated user for response
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Audit log
    await logAction(
      user,
      "USER_DELETED",
      userId,
      "User",
      {
        email: existingUser.email,
        role: existingUser.role,
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      data: updatedUser,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_USERS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to delete user",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}
