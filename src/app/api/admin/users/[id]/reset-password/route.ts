import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/[id]/reset-password
 * Reset a user's password (only for credentials users)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = randomUUID();
  const userId = params.id;
  console.log(`[ADMIN_USERS][${correlationId}] Reset password request for user ${userId}`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser || existingUser.deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "User not found" },
          correlationId,
        },
        { status: 404 }
      );
    }

    // Check if user is OAuth (cannot reset password for OAuth users)
    if (existingUser.authProvider && existingUser.authProvider !== "credentials") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Cannot reset password for OAuth users (auth provider: ${existingUser.authProvider})`,
          },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Generate secure temporary password
    const tempPassword = Math.random().toString(36).slice(-12) +
      Math.random().toString(36).slice(-12).toUpperCase() +
      "!@#";
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    // TODO: Send email with temporary password
    // For now, log it (in production, this should be sent via email service)
    console.log(`[ADMIN_USERS][${correlationId}] Password reset for ${existingUser.email}. Temp password: ${tempPassword} (EMAIL NOT SENT - service not configured)`);

    // Audit log
    await logAction(
      user,
      "USER_PASSWORD_RESET",
      userId,
      "User",
      {
        email: existingUser.email,
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. User will be required to change password on next login.",
      // In production, don't return the password. This is for development only.
      ...(process.env.NODE_ENV === "development" && { tempPassword }),
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_USERS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to reset password",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}
