import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, CAMPAIGN_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

interface UpdateCampaignRecipientRequest {
  action: "UPDATE_PART";
  currentMessagePart: number;
  status?: string;
}

/**
 * PATCH /api/campaigns/:campaignId/recipients/:recipientId
 * Update CampaignRecipient state for Quick Send workflow
 * Mandatory endpoint for split message mode state persistence
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { campaignId: string; recipientId: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId, recipientId } = params;
    const body: UpdateCampaignRecipientRequest = await request.json();
    const { action, currentMessagePart, status } = body;

    if (action !== "UPDATE_PART") {
      return NextResponse.json(
        { error: "Invalid action. Must be UPDATE_PART" },
        { status: 400 }
      );
    }

    if (currentMessagePart !== undefined && (currentMessagePart < 1 || currentMessagePart > 3)) {
      return NextResponse.json(
        { error: "currentMessagePart must be 1, 2, or 3" },
        { status: 400 }
      );
    }

    // Get campaign to verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { recipients: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Verify user owns campaign or is admin
    if (campaign.userId !== user.id && user.role !== "PLATFORM_ADMIN" && user.role !== "RECRUITER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get recipient
    const recipient = await prisma.campaignRecipient.findUnique({
      where: { id: recipientId },
      include: { campaign: true },
    });

    if (!recipient || recipient.campaignId !== campaignId) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Determine final status based on currentMessagePart and campaign split mode
    let finalStatus = recipient.status;
    const isSplitMode = campaign.splitMessageMode;
    const hasMessage3 = campaign.message3Template && campaign.message3Template.trim().length > 0;

    // Status logic: Only mark as SENT when all parts are complete
    if (isSplitMode && currentMessagePart !== undefined) {
      if (hasMessage3) {
        // All 3 messages required
        if (currentMessagePart === 3) {
          finalStatus = "SENT";
        } else {
          // Keep as PENDING while parts are incomplete
          finalStatus = recipient.status === "SENT" ? "SENT" : "PENDING";
        }
      } else {
        // Only 2 messages required (Message 3 is empty)
        if (currentMessagePart === 2) {
          finalStatus = "SENT";
        } else {
          // Keep as PENDING while parts are incomplete
          finalStatus = recipient.status === "SENT" ? "SENT" : "PENDING";
        }
      }
    } else if (status) {
      // Allow explicit status override if provided
      finalStatus = status;
    }

    // Update recipient
    const updateData: any = {};
    if (currentMessagePart !== undefined) {
      updateData.currentMessagePart = currentMessagePart;
    }
    if (finalStatus !== recipient.status) {
      updateData.status = finalStatus;
      if (finalStatus === "SENT") {
        updateData.sentAt = new Date();
      }
    }

    const updatedRecipient = await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: updateData,
    });

    // Log action
    await logAction(
      user,
      CAMPAIGN_ACTIONS.MESSAGE_OPENED, // Using existing action for now
      recipientId,
      "CampaignRecipient",
      {
        campaignId,
        action: "UPDATE_PART",
        currentMessagePart,
        previousStatus: recipient.status,
        newStatus: finalStatus,
      }
    ).catch(() => { });

    return NextResponse.json({
      recipient: updatedRecipient,
    });
  } catch (error: any) {
    console.error("[CAMPAIGNS] Error updating recipient:", error);
    return NextResponse.json(
      {
        error: "Failed to update recipient",
        detail: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

