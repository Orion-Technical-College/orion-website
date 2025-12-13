import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, CAMPAIGN_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/sessions/:sessionId/cancel
 * Cancel a guided send session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = params;

    // Get session
    const session = await prisma.guidedSendSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify user owns session or is admin
    if (session.createdByUserId !== user.id && user.role !== "PLATFORM_ADMIN" && user.role !== "RECRUITER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cancel session and bulk update recipients in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark session as CANCELLED
      const updatedSession = await tx.guidedSendSession.update({
        where: { id: sessionId },
        data: {
          status: "CANCELLED",
          completedAt: new Date(),
        },
      });

      // Bulk update: Set recipients with status IN (PENDING, OPENED) to CANCELLED
      await tx.guidedSendRecipient.updateMany({
        where: {
          sessionId,
          status: { in: ["PENDING", "OPENED"] },
        },
        data: {
          status: "CANCELLED",
        },
      });

      // Get all recipients for counts
      const allRecipients = await tx.guidedSendRecipient.findMany({
        where: { sessionId },
        orderBy: { order: "asc" },
      });

      return { updatedSession, allRecipients };
    });

    // Compute counts
    const counts = computeCounts(result.allRecipients);

    // Log cancellation
    await logAction(
      user,
      CAMPAIGN_ACTIONS.SESSION_CANCELLED,
      sessionId,
      "GuidedSendSession",
      {
        cancelledRecipients: counts.cancelled,
      }
    ).catch(() => { });

    return NextResponse.json({
      session: result.updatedSession,
      counts,
    });
  } catch (error: any) {
    console.error("[SESSIONS] Error cancelling session:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel session",
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
