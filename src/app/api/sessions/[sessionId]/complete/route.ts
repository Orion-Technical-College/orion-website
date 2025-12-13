import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, CAMPAIGN_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/sessions/:sessionId/complete
 * Manually mark session as COMPLETED (optional endpoint)
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
      include: {
        recipients: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify user owns session or is admin
    if (session.createdByUserId !== user.id && user.role !== "PLATFORM_ADMIN" && user.role !== "RECRUITER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update session to COMPLETED
    const updatedSession = await prisma.guidedSendSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Compute counts
    const counts = computeCounts(session.recipients);

    // Log completion
    await logAction(
      user,
      CAMPAIGN_ACTIONS.SESSION_COMPLETED,
      sessionId,
      "GuidedSendSession",
      {
        totalRecipients: session.recipients.length,
        sent: counts.sent,
        skipped: counts.skipped,
        manual: true,
      }
    ).catch(() => { });

    return NextResponse.json({
      session: updatedSession,
      counts,
    });
  } catch (error: any) {
    console.error("[SESSIONS] Error completing session:", error);
    return NextResponse.json(
      {
        error: "Failed to complete session",
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
