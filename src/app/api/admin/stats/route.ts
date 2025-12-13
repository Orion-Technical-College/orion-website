import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { adminWhere } from "@/lib/admin-helpers";
import { logAction } from "@/lib/audit";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats
 * Get dashboard statistics for admin overview
 */
export async function GET(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_STATS][${correlationId}] Incoming request`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    // Get user counts by role (excluding soft-deleted)
    // Note: groupBy may not work with SQL Server, use manual aggregation
    const allUsers = await prisma.user.findMany({
      where: {
        // deletedAt: null, // Will be available after migration
      },
      select: {
        role: true,
      },
    });

    // Manual aggregation
    const usersByRoleMap: Record<string, number> = {};
    allUsers.forEach((user) => {
      usersByRoleMap[user.role] = (usersByRoleMap[user.role] || 0) + 1;
    });

    const totalUsers = await prisma.user.count({
      // where: { deletedAt: null }, // Will be available after migration
    });

    // Get client counts
    const totalClients = await prisma.client.count({
      // where: { deletedAt: null }, // Will be available after migration
    });

    const activeClients = await prisma.client.count({
      where: {
        // deletedAt: null, // Will be available after migration
        isActive: true,
      },
    });

    const inactiveClients = totalClients - activeClients;

    // Get candidate count
    const totalCandidates = await prisma.candidate.count();

    // Get recent audit logs (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAuditLogs = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    // Check system health
    let databaseHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error(`[ADMIN_STATS][${correlationId}] Database health check failed:`, error);
      databaseHealth = 'down';
    }

    let azureOpenAIHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
    try {
      const hasEndpoint = !!process.env.AZURE_OPENAI_ENDPOINT;
      const hasKey = !!process.env.AZURE_OPENAI_API_KEY;
      if (!hasEndpoint || !hasKey) {
        azureOpenAIHealth = 'degraded';
      }
    } catch (error) {
      azureOpenAIHealth = 'down';
    }

    // usersByRoleMap already created above

    const stats = {
      totalUsers,
      usersByRole: usersByRoleMap,
      totalClients,
      activeClients,
      inactiveClients,
      totalCandidates,
      recentAuditLogs,
      systemHealth: {
        database: databaseHealth,
        azureOpenAI: azureOpenAIHealth,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_STATS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to fetch admin statistics",
        },
        correlationId,
      },
      { status: error.message?.includes("required") ? 403 : 500 }
    );
  }
}
