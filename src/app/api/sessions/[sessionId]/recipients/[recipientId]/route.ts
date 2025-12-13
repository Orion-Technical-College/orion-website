import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, CAMPAIGN_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

interface UpdateRecipientRequest {
  action: "OPEN" | "MARK_SENT" | "SKIP" | "MARK_FAILED";
  skippedReason?: string;
}

/**
 * PATCH /api/sessions/:sessionId/recipients/:recipientId
 * Update recipient status (action-based)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string; recipientId: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, recipientId } = params;
    const body: UpdateRecipientRequest = await request.json();
    const { action, skippedReason } = body;

    if (!action || !["OPEN", "MARK_SENT", "SKIP", "MARK_FAILED"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be OPEN, MARK_SENT, SKIP, or MARK_FAILED" },
        { status: 400 }
      );
    }

    // Get session to check terminal state
    const session = await prisma.guidedSendSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Session-level guardrails: reject if session is CANCELLED or COMPLETED
    if (session.status === "CANCELLED" || session.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot update recipients in a cancelled or completed session" },
        { status: 409 }
      );
    }

    // Verify user owns session or is admin
    if (session.createdByUserId !== user.id && user.role !== "PLATFORM_ADMIN" && user.role !== "RECRUITER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get recipient
    const recipient = await prisma.guidedSendRecipient.findUnique({
      where: { id: recipientId },
    });

    if (!recipient || recipient.sessionId !== sessionId) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // OPEN validation: reject if phoneE164 is null
    if (action === "OPEN" && !recipient.phoneE164) {
      return NextResponse.json(
        { error: "Cannot open SMS compose: phone number is invalid" },
        { status: 400 }
      );
    }

    // Enforce valid transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ["OPENED", "SKIPPED"],
      OPENED: ["SENT", "SKIPPED", "FAILED"],
      SENT: [], // Terminal
      SKIPPED: [], // Terminal
      BLOCKED: [], // Terminal - no transitions
      CANCELLED: [], // Terminal - server-internal only
      FAILED: [], // Terminal in v1
    };

    let newStatus: string;
    let updateData: any = {};

    switch (action) {
      case "OPEN":
        // Idempotent: allowed on PENDING or OPENED
        if (recipient.status !== "PENDING" && recipient.status !== "OPENED") {
          return NextResponse.json(
            { error: `Cannot OPEN recipient with status ${recipient.status}` },
            { status: 400 }
          );
        }
        newStatus = "OPENED";
        updateData = {
          status: newStatus,
          openCount: { increment: 1 },
          lastOpenedAt: new Date(),
          // Set openedAt only on first OPEN (when transitioning from PENDING)
          ...(recipient.status === "PENDING" && { openedAt: new Date() }),
        };
        break;

      case "MARK_SENT":
        // Idempotency: ignore if already SENT
        if (recipient.status === "SENT") {
          // Return existing state without error
          const allRecipients = await prisma.guidedSendRecipient.findMany({
            where: { sessionId },
            orderBy: { order: "asc" },
          });
          const counts = computeCounts(allRecipients);
          const nextRecipientId = computeNextRecipientId(allRecipients);

          return NextResponse.json({
            session: await prisma.guidedSendSession.findUnique({ where: { id: sessionId } }),
            updatedRecipient: recipient,
            nextRecipientId,
            counts,
          });
        }
        if (recipient.status !== "OPENED") {
          return NextResponse.json(
            { error: `Cannot MARK_SENT recipient with status ${recipient.status}` },
            { status: 400 }
          );
        }
        newStatus = "SENT";
        updateData = {
          status: newStatus,
          sentAt: new Date(),
        };
        break;

      case "SKIP":
        if (recipient.status !== "PENDING" && recipient.status !== "OPENED") {
          return NextResponse.json(
            { error: `Cannot SKIP recipient with status ${recipient.status}` },
            { status: 400 }
          );
        }
        newStatus = "SKIPPED";
        updateData = {
          status: newStatus,
          skippedReason: skippedReason || "User skipped",
        };
        break;

      case "MARK_FAILED":
        if (recipient.status !== "OPENED") {
          return NextResponse.json(
            { error: `Cannot MARK_FAILED recipient with status ${recipient.status}` },
            { status: 400 }
          );
        }
        newStatus = "FAILED";
        updateData = {
          status: newStatus,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update recipient and session in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedRecipient = await tx.guidedSendRecipient.update({
        where: { id: recipientId },
        data: updateData,
      });

      // Update session lastActiveRecipientId and currentIndex
      await tx.guidedSendSession.update({
        where: { id: sessionId },
        data: {
          lastActiveRecipientId: recipientId,
          currentIndex: updatedRecipient.order,
        },
      });

      // Get all recipients to compute completion
      const allRecipients = await tx.guidedSendRecipient.findMany({
        where: { sessionId },
        orderBy: { order: "asc" },
      });

      // Auto-complete session if remaining count reaches 0
      const remaining = allRecipients.filter(
        (r) => r.status === "PENDING" || r.status === "OPENED"
      ).length;

      if (remaining === 0) {
        await tx.guidedSendSession.update({
          where: { id: sessionId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      }

      return { updatedRecipient, allRecipients };
    });

    // Compute counts and nextRecipientId
    const counts = computeCounts(result.allRecipients);
    const nextRecipientId = computeNextRecipientId(result.allRecipients);

    // Get updated session
    const updatedSession = await prisma.guidedSendSession.findUnique({
      where: { id: sessionId },
    });

    // Log action
    const actionMap: Record<string, string> = {
      OPEN: CAMPAIGN_ACTIONS.MESSAGE_OPENED,
      MARK_SENT: CAMPAIGN_ACTIONS.MESSAGE_SENT,
      SKIP: CAMPAIGN_ACTIONS.MESSAGE_SKIPPED,
      MARK_FAILED: CAMPAIGN_ACTIONS.MESSAGE_FAILED,
    };

    await logAction(
      user,
      actionMap[action] || "CAMPAIGN_RECIPIENT_UPDATED",
      recipientId,
      "GuidedSendRecipient",
      {
        sessionId,
        action,
        previousStatus: recipient.status,
        newStatus,
      }
    ).catch(() => { });

    // Log session completion if applicable
    if (updatedSession?.status === "COMPLETED") {
      await logAction(
        user,
        CAMPAIGN_ACTIONS.SESSION_COMPLETED,
        sessionId,
        "GuidedSendSession",
        {
          totalRecipients: result.allRecipients.length,
          sent: counts.sent,
          skipped: counts.skipped,
        }
      ).catch(() => { });
    }

    return NextResponse.json({
      session: updatedSession,
      updatedRecipient: result.updatedRecipient,
      nextRecipientId,
      counts,
    });
  } catch (error: any) {
    console.error("[SESSIONS] Error updating recipient:", error);
    return NextResponse.json(
      {
        error: "Failed to update recipient",
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
