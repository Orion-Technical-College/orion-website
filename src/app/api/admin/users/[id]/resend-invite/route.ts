import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sendInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/[id]/resend-invite
 * Generates a fresh temporary password and sends invite email.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = randomUUID();
  const userId = params.id;
  console.log(`[ADMIN_USERS][${correlationId}] Resend invite request for user ${userId}`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

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

    if (existingUser.authProvider && existingUser.authProvider !== "credentials") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Cannot resend invite for OAuth users" },
          correlationId,
        },
        { status: 400 }
      );
    }

    const temporaryPassword =
      Math.random().toString(36).slice(-12) +
      Math.random().toString(36).slice(-12).toUpperCase() +
      "!";
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    const emailResult = await sendInviteEmail({
      toEmail: existingUser.email,
      toName: existingUser.name,
      temporaryPassword,
      correlationId,
    });

    await logAction(
      user,
      "USER_INVITE_RESENT",
      userId,
      "User",
      {
        email: existingUser.email,
        inviteEmailSent: emailResult.success,
        inviteEmailError: emailResult.error,
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: emailResult.success
        ? "Invite email resent successfully."
        : "Invite regenerated, but email delivery failed.",
      inviteEmailSent: emailResult.success,
      inviteEmailError: emailResult.error,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_USERS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to resend invite",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}
