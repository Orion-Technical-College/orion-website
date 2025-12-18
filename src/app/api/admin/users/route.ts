import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES, isValidRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { adminWhere } from "@/lib/admin-helpers";
import { logAction } from "@/lib/audit";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { UserQueryFilters, UserFormData } from "@/types/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * List users with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_USERS][${correlationId}] GET request`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") || undefined;
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
        { email: { contains: search } },
      ];
    }

    // Role filter
    if (role && isValidRole(role)) {
      where.role = role;
    }

    // Status filter
    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Build orderBy (handle createdAt specially for SQL Server)
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortDir;
    } else {
      orderBy[sortBy] = sortDir;
    }

    // Get users
    const users = await prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        mustChangePassword: false,
        authProvider: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        // deletedAt: true, // Will be available after migration
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_USERS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to fetch users",
        },
        correlationId,
      },
      { status: error.message?.includes("required") ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  console.log(`[ADMIN_USERS][${correlationId}] POST request`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    const body: UserFormData = await request.json();
    const { name, email, role, clientId, isActive, sendInvite } = body;

    // Validation
    if (!name || !email || !role) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Name, email, and role are required" },
          correlationId,
        },
        { status: 400 }
      );
    }

    if (!isValidRole(role)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid role" },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid email format" },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Check if email already exists (excluding soft-deleted)
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "User with this email already exists" },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Client assignment validation
    if (role === ROLES.CLIENT_ADMIN || role === ROLES.CLIENT_USER) {
      if (!clientId) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Client assignment is required for CLIENT_ADMIN and CLIENT_USER roles" },
            correlationId,
          },
          { status: 400 }
        );
      }

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client || (client as any).deletedAt) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Invalid client" },
            correlationId,
          },
          { status: 400 }
        );
      }
    }

    // Generate password if sending invite
    let passwordHash: string | undefined;
    if (sendInvite) {
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + "!";
      passwordHash = await bcrypt.hash(tempPassword, 10);
      // TODO: Send email with temporary password
      console.log(`[ADMIN_USERS][${correlationId}] Generated temp password for ${email} (not sent - email service not configured)`);
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        clientId: role === ROLES.CLIENT_ADMIN || role === ROLES.CLIENT_USER ? clientId : null,
        isActive,
        passwordHash,
        mustChangePassword: false,
        authProvider: "credentials",
        isInternal: role === ROLES.PLATFORM_ADMIN || role === ROLES.RECRUITER,
        createdBy: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        mustChangePassword: false,
        authProvider: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    // Audit log
    await logAction(
      user,
      "USER_CREATED",
      newUser.id,
      "User",
      {
        email: newUser.email,
        role: newUser.role,
        clientId: newUser.clientId,
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      data: newUser,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_USERS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to create user",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}
