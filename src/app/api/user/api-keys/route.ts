import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Force dynamic rendering since we use request headers
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

/**
 * GET /api/user/api-keys
 * Retrieve API keys for the current user
 * 
 * TODO: Add authentication middleware to get current user ID
 * For now, using a temporary user lookup by email
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get user ID from session/auth token
    // For now, we'll use a query parameter or header
    const email = request.headers.get("x-user-email") || request.nextUrl.searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        googleMessagesApiKey: true,
        calendlyApiKey: true,
        zoomApiKey: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return API keys (masked for security)
    return NextResponse.json({
      googleMessages: user.googleMessagesApiKey ? maskApiKey(user.googleMessagesApiKey) : null,
      calendly: user.calendlyApiKey ? maskApiKey(user.calendlyApiKey) : null,
      zoom: user.zoomApiKey ? maskApiKey(user.zoomApiKey) : null,
      hasGoogleMessages: !!user.googleMessagesApiKey,
      hasCalendly: !!user.calendlyApiKey,
      hasZoom: !!user.zoomApiKey,
    });
  } catch (error: any) {
    console.error("Error fetching API keys:", error);
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
    const email = request.headers.get("x-user-email") || request.nextUrl.searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

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

    const user = await prisma.user.update({
      where: { email },
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
      hasGoogleMessages: !!user.googleMessagesApiKey,
      hasCalendly: !!user.calendlyApiKey,
      hasZoom: !!user.zoomApiKey,
    });
  } catch (error: any) {
    console.error("Error updating API keys:", error);
    
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

