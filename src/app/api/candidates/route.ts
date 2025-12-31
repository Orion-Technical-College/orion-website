import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * GET /api/candidates
 * Fetch candidates for the current user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || "";

    // Build where clause with tenant filtering
    const whereClause: any = {
      ...tenantWhere(user),
    };

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { jobTitle: { contains: search } },
        { location: { contains: search } },
      ];
    }

    // Fetch candidates
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          jobTitle: true,
          location: true,
          date: true,
          status: true,
          notes: true,
          smsConsentStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.candidate.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      candidates,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[CANDIDATES] Error fetching candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

