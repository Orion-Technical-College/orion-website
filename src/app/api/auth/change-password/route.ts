import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import bcrypt from "bcrypt";
import { Role, ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

import { validatePassword } from "@/lib/password-validation";

/**
 * PUT /api/auth/change-password
 * Change user password
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, passwordHash: true, role: true, clientId: true, isInternal: true },
    });

    if (!dbUser || !dbUser.passwordHash) {
      return NextResponse.json(
        { error: "User not found or password not set" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password, set emailVerified, and clear mustChangePassword
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        emailVerified: new Date(), // Mark as verified when password is changed
        mustChangePassword: false, // Clear the flag after password change
      },
    });

    // Log password change
    await logAction(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        isInternal: user.isInternal,
      },
      user.role === ROLES.PLATFORM_ADMIN ? "PLATFORM_ADMIN_PASSWORD_ROTATE" : "PASSWORD_CHANGED",
      user.id,
      "User",
      { email: user.email }
    );

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("Error changing password:", error);
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}

