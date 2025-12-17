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
 * Accepts optional custom password in request body
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

    // Parse request body for optional custom password
    let customPassword: string | undefined;
    try {
      const body = await request.json();
      customPassword = body.password;
    } catch {
      // No body or invalid JSON - will use generated password
    }

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

    // Validate custom password if provided
    if (customPassword) {
      if (customPassword.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Password must be at least 8 characters" },
            correlationId,
          },
          { status: 400 }
        );
      }
      if (!/[A-Z]/.test(customPassword)) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Password must contain at least one uppercase letter" },
            correlationId,
          },
          { status: 400 }
        );
      }
      if (!/[a-z]/.test(customPassword)) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Password must contain at least one lowercase letter" },
            correlationId,
          },
          { status: 400 }
        );
      }
      if (!/[0-9]/.test(customPassword)) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Password must contain at least one number" },
            correlationId,
          },
          { status: 400 }
        );
      }
    }

    // Use custom password or generate a secure temporary password
    const finalPassword = customPassword || (
      Math.random().toString(36).slice(-12) +
      Math.random().toString(36).slice(-12).toUpperCase() +
      "!@#"
    );
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    // Log password set (for debugging - in production, send via email)
    console.log(`[ADMIN_USERS][${correlationId}] Password ${customPassword ? 'set' : 'reset'} for ${existingUser.email}. (EMAIL NOT SENT - service not configured)`);

    // Audit log
    await logAction(
      user,
      "USER_PASSWORD_RESET",
      userId,
      "User",
      {
        email: existingUser.email,
        customPasswordUsed: !!customPassword,
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: "Password set successfully. User will be required to change password on next login.",
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_USERS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to set password",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}
