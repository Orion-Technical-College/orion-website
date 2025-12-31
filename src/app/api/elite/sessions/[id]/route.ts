/**
 * GET /api/elite/sessions/[id] - Get session by ID
 * PUT /api/elite/sessions/[id] - Update session
 * DELETE /api/elite/sessions/[id] - Cancel session
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveEliteContext } from "@/lib/elite/kernel/context";
import { sessionService } from "@/lib/elite/services/session";
import { z } from "zod";

// Validation schema for updating a session
const updateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  agenda: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  timezone: z.string().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  zoomUrl: z.string().url().optional().nullable().or(z.literal("")),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const ctx = await resolveEliteContext(session);
    
    if (!ctx) {
      return NextResponse.json(
        { error: "ELITE workspace access denied" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const eliteSession = await sessionService.getById(ctx, id);
    
    if (!eliteSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(eliteSession);
  } catch (error) {
    console.error("[GET /api/elite/sessions/[id]] Error:", error);
    
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const ctx = await resolveEliteContext(session);
    
    if (!ctx) {
      return NextResponse.json(
        { error: "ELITE workspace access denied" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const input = updateSessionSchema.parse(body);

    // Convert empty string/null values to undefined for optional fields
    const sessionInput = {
      ...input,
      zoomUrl: input.zoomUrl === "" ? undefined : input.zoomUrl ?? undefined,
      description: input.description === null ? undefined : input.description,
      agenda: input.agenda === null ? undefined : input.agenda,
    };

    const eliteSession = await sessionService.update(ctx, id, sessionInput);
    return NextResponse.json(eliteSession);
  } catch (error) {
    console.error("[PUT /api/elite/sessions/[id]] Error:", error);
    
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const ctx = await resolveEliteContext(session);
    
    if (!ctx) {
      return NextResponse.json(
        { error: "ELITE workspace access denied" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await sessionService.cancel(ctx, id);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/elite/sessions/[id]] Error:", error);
    
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

