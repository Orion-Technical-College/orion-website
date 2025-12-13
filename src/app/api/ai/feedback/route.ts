import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getLangfuseClient } from "@/lib/langfuse-client";
import { logAction } from "@/lib/audit";

// Force dynamic rendering since we use session
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/feedback
 * Submit user feedback for an AI response
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { messageId, score, traceId, correlationId, comment } = body;

    if (!messageId || score === undefined) {
      return NextResponse.json(
        { error: "messageId and score are required" },
        { status: 400 }
      );
    }

    // Validate score (0 or 1)
    const scoreValue = typeof score === "number" ? score : score === "positive" || score === 1 ? 1 : 0;
    if (scoreValue !== 0 && scoreValue !== 1) {
      return NextResponse.json(
        { error: "score must be 0 or 1" },
        { status: 400 }
      );
    }

    // Submit feedback to Langfuse
    const langfuse = getLangfuseClient();
    if (langfuse && traceId) {
      try {
        // Create a score for the trace using the actual traceId
        langfuse.score({
          name: "user-feedback",
          value: scoreValue,
          comment: comment || undefined,
          traceId: traceId, // Use actual traceId from the trace
        });
      } catch (langfuseError) {
        console.error("[FEEDBACK] Failed to submit to Langfuse:", langfuseError);
        // Continue - we still want to log to audit
      }
    } else if (!traceId) {
      console.warn("[FEEDBACK] No traceId provided, cannot submit to Langfuse");
    }

    // Log to audit
    try {
      await logAction(
        user,
        "AI_FEEDBACK_SUBMITTED",
        undefined,
        undefined,
        {
          messageId,
          score: scoreValue,
          correlationId,
          hasComment: !!comment,
        }
      );
    } catch (logErr) {
      console.error("[FEEDBACK] Failed to log action:", logErr);
    }

    // Flush Langfuse if available
    if (langfuse) {
      try {
        await langfuse.flushAsync();
      } catch (flushError) {
        console.error("[FEEDBACK] Failed to flush Langfuse:", flushError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error: any) {
    console.error("[FEEDBACK] Error:", error);
    return NextResponse.json(
      {
        error: "An error occurred submitting feedback",
        detail: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
