import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type { ClientQueryFilters, ClientFormData } from "@/types/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/clients
 * List clients with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_CLIENTS][${correlationId}] GET request`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    // Build where clause
    const where: any = {};

    // Soft delete filter
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    // Search filter (SQL Server case-insensitive by default)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { domain: { contains: search } },
      ];
    }

    // Status filter
    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    // Get total count
    const total = await prisma.client.count({ where });

    // Build orderBy (handle createdAt specially for SQL Server)
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortDir;
    } else {
      orderBy[sortBy] = sortDir;
    }

    // Get clients
    const clients = await prisma.client.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get counts for each client
    const clientsWithCounts = await Promise.all(
      clients.map(async (client) => {
        const userCount = await prisma.user.count({
          where: {
            clientId: client.id,
          },
        });

        const candidateCount = await prisma.candidate.count({
          where: {
            clientId: client.id,
          },
        });

        return {
          ...client,
          userCount,
          candidateCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: clientsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_CLIENTS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to fetch clients",
        },
        correlationId,
      },
      { status: error.message?.includes("required") ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_CLIENTS][${correlationId}] POST request`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    const body: ClientFormData = await request.json();
    const { name, domain, isActive } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Client name is required and must be at least 2 characters" },
          correlationId,
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Client name must be less than 100 characters" },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Domain validation (optional)
    if (domain && domain.trim().length > 0) {
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(domain)) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Invalid domain format" },
            correlationId,
          },
          { status: 400 }
        );
      }
    }

    // Check if client name already exists (excluding soft-deleted)
    const existingClient = await prisma.client.findFirst({
      where: {
        name: { equals: name },
      },
    });

    if (existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Client with this name already exists" },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Create client
    const newClient = await prisma.client.create({
      data: {
        name: name.trim(),
        domain: domain?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Audit log
    await logAction(
      user,
      "CLIENT_CREATED",
      newClient.id,
      "Client",
      {
        name: newClient.name,
        domain: newClient.domain,
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      data: newClient,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_CLIENTS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to create client",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}
