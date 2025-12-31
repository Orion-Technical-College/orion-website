/**
 * GET /api/elite/cohorts/[id] - Get cohort by ID
 * PUT /api/elite/cohorts/[id] - Update cohort
 * DELETE /api/elite/cohorts/[id] - Archive cohort
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveEliteContext } from "@/lib/elite/kernel/context";
import { cohortService } from "@/lib/elite/services/cohort";
import { z } from "zod";

// Validation schema for updating a cohort
const updateCohortSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  startDate: z.string().datetime().optional().nullable().transform(v => v ? new Date(v) : undefined),
  endDate: z.string().datetime().optional().nullable().transform(v => v ? new Date(v) : undefined),
  timezone: z.string().optional(),
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
    const cohort = await cohortService.getById(ctx, id);
    
    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    return NextResponse.json(cohort);
  } catch (error) {
    console.error("[GET /api/elite/cohorts/[id]] Error:", error);
    
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
    const input = updateCohortSchema.parse(body);

    const cohort = await cohortService.update(ctx, id, input);
    return NextResponse.json(cohort);
  } catch (error) {
    console.error("[PUT /api/elite/cohorts/[id]] Error:", error);
    
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
    await cohortService.delete(ctx, id);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/elite/cohorts/[id]] Error:", error);
    
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

