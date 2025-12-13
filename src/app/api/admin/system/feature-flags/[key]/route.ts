import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { setSystemSetting } from "@/lib/admin-helpers";
import { logAction } from "@/lib/audit";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/system/feature-flags/[key]
 * Toggle a feature flag
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const correlationId = randomUUID();
  const key = params.key;
  console.log(`[ADMIN_FEATURE_FLAG][${correlationId}] PATCH request for ${key}`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    const body = await request.json();
    const { isEnabled, description } = body;

    if (typeof isEnabled !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "isEnabled must be a boolean" },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Update feature flag
    await setSystemSetting(key, isEnabled, user.id, description);

    // Audit log
    await logAction(
      user,
      "FEATURE_FLAG_UPDATED",
      key,
      "SystemSetting",
      {
        key,
        isEnabled,
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: `Feature flag ${key} ${isEnabled ? "enabled" : "disabled"}`,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_FEATURE_FLAG][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to update feature flag",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}
