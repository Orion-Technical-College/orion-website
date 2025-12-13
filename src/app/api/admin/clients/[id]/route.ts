import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { canDeleteClient } from "@/lib/admin-helpers";
import { logAction } from "@/lib/audit";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/clients/[id]
 * Update a client
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = randomUUID();
  const clientId = params.id;
  console.log(`[ADMIN_CLIENTS][${correlationId}] PATCH request for client ${clientId}`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    const body = await request.json();
    const { name, domain, isActive } = body;

    // Get existing client
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient || (existingClient as any).deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Client not found" },
          correlationId,
        },
        { status: 404 }
      );
    }

    // Validation
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Client name must be at least 2 characters" },
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

      // Check if name already exists (excluding current client and soft-deleted)
      // Note: SQL Server case-insensitive comparison
      const nameExists = await prisma.client.findFirst({
        where: {
          name: { equals: name },
          NOT: { id: clientId },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Client with this name already exists" },
            correlationId,
          },
          { status: 400 }
        );
      }
    }

    // Domain validation
    if (domain !== undefined && domain && domain.trim().length > 0) {
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

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(name && { name: name.trim() }),
        ...(domain !== undefined && { domain: domain?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Audit log
    await logAction(
      user,
      "CLIENT_UPDATED",
      clientId,
      "Client",
      {
        changes: {
          name: name || existingClient.name,
          domain: domain !== undefined ? domain : existingClient.domain,
          isActive: isActive !== undefined ? isActive : existingClient.isActive,
        },
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      data: updatedClient,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_CLIENTS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to update client",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/clients/[id]
 * Soft delete a client
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = randomUUID();
  const clientId = params.id;
  console.log(`[ADMIN_CLIENTS][${correlationId}] DELETE request for client ${clientId}`);

  try {
    const user = await requireAuth();
    requireRole(user, ROLES.PLATFORM_ADMIN);

    // Get existing client
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Client not found" },
          correlationId,
        },
        { status: 404 }
      );
    }

    if ((existingClient as any).deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Client is already deleted" },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Check if client can be deleted
    const deleteCheck = await canDeleteClient(existingClient, user);
    if (!deleteCheck.canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: deleteCheck.reason || "Cannot delete client",
            details: deleteCheck.details,
          },
          correlationId,
        },
        { status: 400 }
      );
    }

    // Soft delete
    const deletedClient = await prisma.$executeRaw`
      UPDATE Client 
      SET deletedAt = GETDATE(), isActive = 0 
      WHERE id = ${clientId}
    `;

    // Fetch updated client for response
    const updatedClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    // Audit log
    await logAction(
      user,
      "CLIENT_DELETED",
      clientId,
      "Client",
      {
        name: existingClient.name,
        correlationId,
      }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      data: updatedClient,
      correlationId,
    });
  } catch (error: any) {
    console.error(`[ADMIN_CLIENTS][${correlationId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Failed to delete client",
        },
        correlationId,
      },
      { status: 500 }
    );
  }
}
