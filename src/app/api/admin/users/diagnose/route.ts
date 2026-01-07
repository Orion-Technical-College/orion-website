import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users/diagnose?email=kweed@emcsupport.com
 * Diagnose a user account to check for login issues
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Email parameter is required" },
        },
        { status: 400 }
      );
    }

    // Case-insensitive search (same as auth-provider.ts)
    const users = await prisma.$queryRaw<Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      isActive: boolean;
      passwordHash: string | null;
      mustChangePassword: boolean | null;
      createdAt: Date;
      updatedAt: Date;
    }>>`
      SELECT id, email, name, role, "isActive", "passwordHash", "mustChangePassword", "createdAt", "updatedAt"
      FROM "User"
      WHERE LOWER(email) = LOWER(${email.toLowerCase()})
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          found: false,
          email,
          issues: ["User not found in database"],
          suggestions: [
            "Verify the email address is correct",
            "User account may not exist",
            "User may have been deleted",
          ],
        },
      });
    }

    const dbUser = users[0];
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!dbUser.isActive) {
      issues.push("Account is INACTIVE - login will be blocked");
    }

    if (!dbUser.passwordHash) {
      issues.push("No password hash - login will fail");
    }

    if (dbUser.mustChangePassword) {
      warnings.push("User must change password on next login");
    }

    return NextResponse.json({
      success: true,
      data: {
        found: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          isActive: dbUser.isActive,
          hasPasswordHash: !!dbUser.passwordHash,
          mustChangePassword: dbUser.mustChangePassword,
          createdAt: dbUser.createdAt.toISOString(),
          updatedAt: dbUser.updatedAt.toISOString(),
        },
        issues,
        warnings,
        status: issues.length > 0 ? "has_issues" : "ok",
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_DIAGNOSE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to diagnose user",
        },
      },
      { status: error.message?.includes("required") ? 403 : 500 }
    );
  }
}

