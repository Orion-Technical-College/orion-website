import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { normalizePhoneToE164 } from "@/lib/phone-normalize";
import { canSendSms, getBlockedReason } from "@/lib/candidate-validation";
import { interpolateTemplate } from "@/lib/utils";
import { logAction, CAMPAIGN_ACTIONS } from "@/lib/audit";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

interface CreateSessionRequest {
  campaignId: string;
  candidateIds: string[];
  template: string;
  variablesConfig?: Record<string, string>;
  aiDraftMeta?: Record<string, any>;
  messagePolicy?: "LOCKED" | "EDITABLE_PER_RECIPIENT";
}

/**
 * POST /api/sessions
 * Create a new guided send session
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get idempotency key from header
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (idempotencyKey !== null && idempotencyKey.trim() === "") {
      return NextResponse.json(
        { error: "Idempotency-Key must be non-empty if provided" },
        { status: 400 }
      );
    }

    // Check for existing session with same idempotency key
    if (idempotencyKey) {
      const existingSession = await prisma.guidedSendSession.findFirst({
        where: {
          clientId: user.clientId || "",
          createdByUserId: user.id,
          idempotencyKey,
        },
        include: {
          recipients: {
            include: {
              candidate: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      if (existingSession) {
        // Return existing session
        const counts = computeCounts(existingSession.recipients);
        const nextRecipientId = computeNextRecipientId(existingSession.recipients);

        return NextResponse.json({
          sessionId: existingSession.id,
          recipients: existingSession.recipients.map((r) => ({
            id: r.id,
            candidateId: r.candidateId,
            phoneRaw: r.phoneRaw,
            phoneE164: r.phoneE164,
            renderedMessage: r.renderedMessage,
            status: r.status,
            order: r.order,
            blockedReason: r.blockedReason,
          })),
          currentIndex: existingSession.currentIndex,
          nextRecipientId,
          counts,
        });
      }
    }

    // Parse request body
    const body: CreateSessionRequest = await request.json();
    let { campaignId, candidateIds, template, variablesConfig = {}, aiDraftMeta, messagePolicy = "LOCKED" } = body;

    if (!campaignId || !candidateIds || candidateIds.length === 0 || !template) {
      return NextResponse.json(
        { error: "campaignId, candidateIds, and template are required" },
        { status: 400 }
      );
    }

    // Validate campaign exists and user has access
    // Allow "default" or "temp-*" campaign IDs for quick send (create campaign on the fly if needed)
    let campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    // If campaign doesn't exist and it's a temp/default ID, create it
    if (!campaign && (campaignId === "default" || campaignId.startsWith("temp-"))) {
      campaign = await prisma.campaign.create({
        data: {
          userId: user.id,
          name: campaignId.startsWith("temp-") ? `Quick Send ${new Date().toLocaleDateString()}` : "Default Campaign",
          messageTemplate: template,
          calendlyUrl: variablesConfig?.calendly_link || null,
          zoomUrl: variablesConfig?.zoom_link || null,
          status: "ACTIVE",
        },
      });
      // Update campaignId to use the actual created campaign ID
      campaignId = campaign.id;
    } else if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.userId !== user.id && user.role !== "PLATFORM_ADMIN" && user.role !== "RECRUITER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get candidates with tenant filtering
    const candidates = await prisma.candidate.findMany({
      where: {
        ...tenantWhere(user),
        id: { in: candidateIds },
      },
    });

    if (candidates.length !== candidateIds.length) {
      return NextResponse.json(
        { error: "Some candidates were not found or are not accessible" },
        { status: 400 }
      );
    }

    // Determine clientId for session (required)
    const clientId = user.clientId || candidates[0]?.clientId || "";
    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required for session creation" },
        { status: 400 }
      );
    }

    // Process each candidate: validate, normalize phone, render message, determine status
    const recipientData = await Promise.all(
      candidates.map(async (candidate, index) => {
        // Check if SMS can be sent
        const validation = canSendSms(candidate, "US");

        // Normalize phone number
        const phoneRaw = candidate.phone;
        const phoneE164 = validation.status === "ALLOWED"
          ? normalizePhoneToE164(candidate.phone, "US")
          : null;

        // Determine status and blocked reason
        let status: string;
        let blockedReason: string | null = null;

        if (validation.status === "INVALID_PHONE" || !phoneE164) {
          status = "BLOCKED";
          blockedReason = "INVALID_PHONE";
        } else if (validation.status === "BLOCKED") {
          status = "BLOCKED";
          blockedReason = getBlockedReason(candidate, phoneE164) || "CONSENT_UNKNOWN";
        } else {
          status = "PENDING";
        }

        // Compliance rule: If smsConsentStatus != OPTED_IN, block with CONSENT_UNKNOWN
        if (candidate.smsConsentStatus !== "OPTED_IN") {
          status = "BLOCKED";
          blockedReason = "CONSENT_UNKNOWN";
        }

        // Render personalized message (even for BLOCKED - allows remediation)
        const city = candidate.location?.split(",")[0]?.trim() || candidate.location || "";
        const renderedMessage = interpolateTemplate(template, {
          name: candidate.name.split(" ")[0],
          city,
          role: candidate.jobTitle || "",
          calendly_link: campaign.calendlyUrl || "",
          zoom_link: campaign.zoomUrl || "N/A",
          ...variablesConfig,
        });

        return {
          candidateId: candidate.id,
          order: index,
          phoneRaw,
          phoneE164,
          renderedMessage,
          status,
          blockedReason,
        };
      })
    );

    // Create session and recipients in a transaction
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.guidedSendSession.create({
        data: {
          campaignId,
          createdByUserId: user.id,
          idempotencyKey: idempotencyKey || null,
          clientId,
          status: "ACTIVE",
          templateSnapshot: template,
          templateVersion: 1,
          variablesSnapshot: JSON.stringify(variablesConfig),
          messagePolicy,
          aiDraftMeta: aiDraftMeta ? JSON.stringify(aiDraftMeta) : null,
          currentIndex: 0,
          startedAt: new Date(),
        },
      });

      const recipients = await Promise.all(
        recipientData.map((data) =>
          tx.guidedSendRecipient.create({
            data: {
              sessionId: newSession.id,
              candidateId: data.candidateId,
              order: data.order,
              phoneRaw: data.phoneRaw,
              phoneE164: data.phoneE164,
              renderedMessage: data.renderedMessage,
              renderedFromTemplateVersion: 1,
              status: data.status,
              blockedReason: data.blockedReason,
            },
          })
        )
      );

      return { session: newSession, recipients };
    });

    // Compute counts and nextRecipientId
    const counts = computeCounts(session.recipients);
    const nextRecipientId = computeNextRecipientId(session.recipients);

    // Log session creation
    await logAction(
      user,
      CAMPAIGN_ACTIONS.SESSION_STARTED,
      session.session.id,
      "GuidedSendSession",
      {
        campaignId,
        recipientCount: session.recipients.length,
        blockedCount: counts.blocked,
      }
    ).catch(() => { });

    return NextResponse.json({
      sessionId: session.session.id,
      recipients: session.recipients.map((r) => ({
        id: r.id,
        candidateId: r.candidateId,
        phoneRaw: r.phoneRaw,
        phoneE164: r.phoneE164,
        renderedMessage: r.renderedMessage,
        status: r.status,
        order: r.order,
        blockedReason: r.blockedReason,
      })),
      currentIndex: 0,
      nextRecipientId,
      counts,
    });
  } catch (error: any) {
    console.error("[SESSIONS] Error creating session:", error);
    return NextResponse.json(
      {
        error: "Failed to create session",
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
