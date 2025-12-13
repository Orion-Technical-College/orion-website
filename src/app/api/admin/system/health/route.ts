import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/system/health
 * System health check
 */
export async function GET(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_SYSTEM_HEALTH][${correlationId}] GET request`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    // Check database connection
    let databaseHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
    let databaseLatency = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      databaseLatency = Date.now() - start;
      if (databaseLatency > 1000) {
        databaseHealth = 'degraded';
      }
    } catch (error) {
      console.error(`[ADMIN_SYSTEM_HEALTH][${correlationId}] Database health check failed:`, error);
      databaseHealth = 'down';
    }

    // Check Azure OpenAI connection
    let azureOpenAIHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
    const hasEndpoint = !!process.env.AZURE_OPENAI_ENDPOINT;
    const hasKey = !!process.env.AZURE_OPENAI_API_KEY;
    const hasDeployment = !!process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    if (!hasEndpoint || !hasKey || !hasDeployment) {
      azureOpenAIHealth = 'degraded';
    }

    // Overall health
    let overallHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
    if ((databaseHealth as string) === 'down' || (azureOpenAIHealth as string) === 'down') {
      overallHealth = 'down';
    } else if ((databaseHealth as string) === 'degraded' || (azureOpenAIHealth as string) === 'degraded') {
      overallHealth = 'degraded';
    }

    return NextResponse.json({
      success: true,
      data: {
        overall: overallHealth,
        database: {
          status: databaseHealth,
          latency: databaseLatency,
        },
        azureOpenAI: {
          status: azureOpenAIHealth,
          hasEndpoint,
          hasKey,
          hasDeployment,
        },
        timestamp: new Date().toISOString(),
      },
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_SYSTEM_HEALTH][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to check system health",
        },
        correlationId,
      },
      { status: error.message?.includes("required") ? 403 : 500 }
    );
  }
}
