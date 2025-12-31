import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * GET /api/sessions/:sessionId
 * Get current session state (server is source of truth)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = params;

    // Get session with recipients and campaign
    const session = await prisma.guidedSendSession.findUnique({
      where: { id: sessionId },
      include: {
        campaign: {
          select: {
            id: true,
            splitMessageMode: true,
            message1Template: true,
            message2Template: true,
            message3Template: true,
            calendlyUrl: true,
            zoomUrl: true,
          },
        },
        recipients: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                phone: true,
                jobTitle: true,
                location: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify tenant access
    if (session.clientId && user.clientId && session.clientId !== user.clientId) {
      if (user.role !== "PLATFORM_ADMIN" && user.role !== "RECRUITER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Verify user owns session or is admin
    if (session.createdByUserId !== user.id && user.role !== "PLATFORM_ADMIN" && user.role !== "RECRUITER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Compute counts and nextRecipientId
    const counts = computeCounts(session.recipients);
    const nextRecipientId = computeNextRecipientId(session.recipients);

    return NextResponse.json({
      id: session.id,
      campaignId: session.campaignId,
      clientId: session.clientId,
      status: session.status,
      currentIndex: session.currentIndex,
      lastActiveRecipientId: session.lastActiveRecipientId,
      nextRecipientId,
      counts,
      campaign: {
        id: session.campaign.id,
        splitMessageMode: session.campaign.splitMessageMode,
        message1Template: session.campaign.message1Template,
        message2Template: session.campaign.message2Template,
        message3Template: session.campaign.message3Template,
        calendlyUrl: session.campaign.calendlyUrl,
        zoomUrl: session.campaign.zoomUrl,
      },
      variablesSnapshot: session.variablesSnapshot,
      recipients: session.recipients.map((r) => ({
        id: r.id,
        candidateId: r.candidateId,
        candidate: r.candidate,
        order: r.order,
        phoneRaw: r.phoneRaw,
        phoneE164: r.phoneE164,
        renderedMessage: r.renderedMessage,
        renderedFromTemplateVersion: r.renderedFromTemplateVersion,
        currentMessagePart: r.currentMessagePart,
        status: r.status,
        openedAt: r.openedAt,
        openCount: r.openCount,
        lastOpenedAt: r.lastOpenedAt,
        sentAt: r.sentAt,
        skippedReason: r.skippedReason,
        blockedReason: r.blockedReason,
      })),
    });
  } catch (error: any) {
    console.error("[SESSIONS] Error getting session:", error);
    return NextResponse.json(
      {
        error: "Failed to get session",
        detail: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Compute progress counts
 */
function computeCounts(recipients: Array<{ status: string }>) {
  const total = recipients.length;
  const actionableTotal = recipients.filter(
    (r) => r.status !== "BLOCKED" && r.status !== "CANCELLED"
  ).length;
  const sent = recipients.filter((r) => r.status === "SENT").length;
  const skipped = recipients.filter((r) => r.status === "SKIPPED").length;
  const blocked = recipients.filter((r) => r.status === "BLOCKED").length;
  const cancelled = recipients.filter((r) => r.status === "CANCELLED").length;
  const failed = recipients.filter((r) => r.status === "FAILED").length;
  const remaining = recipients.filter(
    (r) => r.status === "PENDING" || r.status === "OPENED"
  ).length;

  return {
    total,
    actionableTotal,
    sent,
    skipped,
    blocked,
    cancelled,
    failed,
    remaining,
  };
}

/**
 * Compute next recipient ID (lowest order among PENDING/OPENED with valid phone)
 */
function computeNextRecipientId(
  recipients: Array<{ id: string; status: string; phoneE164: string | null; order: number }>
): string | null {
  const actionable = recipients
    .filter(
      (r) =>
        (r.status === "PENDING" || r.status === "OPENED") && r.phoneE164 !== null
    )
    .sort((a, b) => a.order - b.order);

  return actionable.length > 0 ? actionable[0].id : null;
}
