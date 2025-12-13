import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

// Force dynamic rendering since we use session
export const dynamic = "force-dynamic";

/**
 * GET /api/user/api-keys
 * Retrieve API keys for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    requirePermission(user, PERMISSIONS.CONFIGURE_API_KEYS);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        googleMessagesApiKey: true,
        calendlyApiKey: true,
        zoomApiKey: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return API keys (masked for security)
    return NextResponse.json({
      googleMessages: dbUser.googleMessagesApiKey ? maskApiKey(dbUser.googleMessagesApiKey) : null,
      calendly: dbUser.calendlyApiKey ? maskApiKey(dbUser.calendlyApiKey) : null,
      zoom: dbUser.zoomApiKey ? maskApiKey(dbUser.zoomApiKey) : null,
      hasGoogleMessages: !!dbUser.googleMessagesApiKey,
      hasCalendly: !!dbUser.calendlyApiKey,
      hasZoom: !!dbUser.zoomApiKey,
    });
  } catch (error: any) {
    console.error("Error fetching API keys:", error);
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (error.message.includes("Permission")) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/api-keys
 * Update API keys for the current user
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    requirePermission(user, PERMISSIONS.CONFIGURE_API_KEYS);

    const body = await request.json();
    const { googleMessages, calendly, zoom } = body;

    // Validate that at least one key is provided
    if (!googleMessages && !calendly && !zoom) {
      return NextResponse.json(
        { error: "At least one API key must be provided" },
        { status: 400 }
      );
    }

    // Build update object (only include keys that are provided)
    const updateData: {
      googleMessagesApiKey?: string | null;
      calendlyApiKey?: string | null;
      zoomApiKey?: string | null;
    } = {};

    if (googleMessages !== undefined) {
      updateData.googleMessagesApiKey = googleMessages || null;
    }
    if (calendly !== undefined) {
      updateData.calendlyApiKey = calendly || null;
    }
    if (zoom !== undefined) {
      updateData.zoomApiKey = zoom || null;
    }

    const dbUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        googleMessagesApiKey: true,
        calendlyApiKey: true,
        zoomApiKey: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "API keys updated successfully",
      hasGoogleMessages: !!dbUser.googleMessagesApiKey,
      hasCalendly: !!dbUser.calendlyApiKey,
      hasZoom: !!dbUser.zoomApiKey,
    });
  } catch (error: any) {
    console.error("Error updating API keys:", error);
    
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (error.message.includes("Permission")) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update API keys" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to mask API keys for display
 */
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return "****";
  }
  return key.substring(0, 4) + "****" + key.substring(key.length - 4);
}

