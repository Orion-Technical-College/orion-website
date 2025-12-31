/**
 * GET /api/elite/sessions - List sessions
 * POST /api/elite/sessions - Create session
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveEliteContext } from "@/lib/elite/kernel/context";
import { sessionService } from "@/lib/elite/services/session";
import { z } from "zod";

// Validation schema for creating a session
const createSessionSchema = z.object({
  cohortId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  agenda: z.string().optional(),
  scheduledAt: z.string().datetime().transform((v) => new Date(v)),
  timezone: z.string().optional(),
  duration: z.number().int().min(15).max(480), // 15 min to 8 hours
  zoomUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const ctx = await resolveEliteContext(session);
    
    if (!ctx) {
      return NextResponse.json(
        { error: "ELITE workspace access denied" },
        { status: 403 }
      );
    }

    // Parse query params
    const url = new URL(req.url);
    const cohortId = url.searchParams.get("cohortId") ?? undefined;
    const upcoming = url.searchParams.get("upcoming") === "true";
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

    let sessions;
    if (upcoming) {
      sessions = await sessionService.listUpcoming(ctx, limit);
    } else {
      sessions = await sessionService.list(ctx, { cohortId });
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[GET /api/elite/sessions] Error:", error);
    
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const ctx = await resolveEliteContext(session);
    
    if (!ctx) {
      return NextResponse.json(
        { error: "ELITE workspace access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const input = createSessionSchema.parse(body);

    // Convert empty string zoomUrl to undefined
    const sessionInput = {
      ...input,
      zoomUrl: input.zoomUrl || undefined,
    };

    const eliteSession = await sessionService.create(ctx, sessionInput);
    return NextResponse.json(eliteSession, { status: 201 });
  } catch (error) {
    console.error("[POST /api/elite/sessions] Error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (error.message.includes("Permission denied")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

