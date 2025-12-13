import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { draftSmsMessage } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

interface DraftRequest {
  eventType: string;
  zoomLink?: string;
  date?: string;
  time?: string;
  timezone?: string;
  variables?: Record<string, string>;
  maxLength?: number;
}

/**
 * POST /api/campaigns/:campaignId/draft
 * AI message drafting (pre-session template creation)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId } = params;
    const body: DraftRequest = await request.json();
    const {
      eventType,
      zoomLink,
      date,
      time,
      timezone,
      variables = {},
      maxLength = 320,
    } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "eventType is required" },
        { status: 400 }
      );
    }

    // Validate campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Verify user has access
    if (campaign.userId !== user.id && user.role !== "PLATFORM_ADMIN" && user.role !== "RECRUITER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build variables object
    const allVariables: Record<string, string> = {
      ...variables,
      zoomLink: zoomLink || "N/A",
      date: date || "N/A",
      time: time || "N/A",
      timezone: timezone || "N/A",
    };

    // Call AI service to draft message
    const draft = await draftSmsMessage(eventType, allVariables, { maxLength });

    // Store draft metadata (optional - for audit trail)
    // In a full implementation, you might store this in the campaign or a draft table

    return NextResponse.json({
      message: draft.message,
      alternate: draft.alternate,
      length: draft.length,
      mustInclude: draft.mustInclude,
      metadata: {
        eventType,
        maxLength,
        validated: true,
      },
    });
  } catch (error: any) {
    console.error("[DRAFT] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to draft message",
        detail: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
