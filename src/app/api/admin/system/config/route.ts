import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSystemSetting } from "@/lib/admin-helpers";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/system/config
 * Get system configuration (read-only, masked)
 */
export async function GET(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_SYSTEM_CONFIG][${correlationId}] GET request`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    // Get feature flags from database
    const featureFlags = await prisma.systemSetting.findMany({
      where: {
        key: { startsWith: "FEATURE_" },
      },
    });

    // Get updater names
    const updaterIds = Array.from(new Set(featureFlags.map((f) => f.updatedBy)));
    const updaters = await prisma.user.findMany({
      where: {
        id: { in: updaterIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const updaterMap = new Map(updaters.map((u) => [u.id, u.name]));

    const flags = featureFlags.map((flag) => ({
      key: flag.key,
      isEnabled: flag.isEnabled,
      description: flag.description || `Feature flag for ${flag.key}`,
      lastUpdated: flag.updatedAt,
      updatedBy: flag.updatedBy,
      updatedByName: updaterMap.get(flag.updatedBy) || "Unknown",
    }));

    // Mask Azure OpenAI deployment name
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
    const maskedDeployment = deploymentName.length > 8
      ? `${deploymentName.substring(0, 4)}***${deploymentName.substring(deploymentName.length - 4)}`
      : "***";

    // Check Azure config status
    const hasEndpoint = !!process.env.AZURE_OPENAI_ENDPOINT;
    const hasKey = !!process.env.AZURE_OPENAI_API_KEY;
    const azureConfigStatus = hasEndpoint && hasKey ? "configured" : "missing";

    // Get AI Assistant feature flag (check DB first, fall back to env)
    const aiAssistantEnabled = await getSystemSetting("FEATURE_AI_ASSISTANT");

    return NextResponse.json({
      success: true,
      data: {
        featureFlags: flags,
        azureOpenAI: {
          deploymentName: maskedDeployment,
          status: azureConfigStatus,
          hasEndpoint,
          hasKey,
        },
        aiAssistant: {
          enabled: aiAssistantEnabled,
        },
        environment: process.env.NODE_ENV || "development",
      },
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_SYSTEM_CONFIG][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to fetch system configuration",
        },
        correlationId,
      },
      { status: error.message?.includes("required") ? 403 : 500 }
    );
  }
}
