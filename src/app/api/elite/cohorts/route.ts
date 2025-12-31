/**
 * GET /api/elite/cohorts - List cohorts
 * POST /api/elite/cohorts - Create cohort
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveEliteContext } from "@/lib/elite/kernel/context";
import { cohortService } from "@/lib/elite/services/cohort";
import { z } from "zod";

// Validation schema for creating a cohort
const createCohortSchema = z.object({
  name: z.string().min(1).max(100),
  programTemplateId: z.string().min(1),
  orgUnitId: z.string().optional(),
  startDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  endDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  timezone: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const ctx = await resolveEliteContext(session);
    
    if (!ctx) {
      return NextResponse.json(
        { error: "ELITE workspace access denied" },
        { status: 403 }
      );
    }

    const cohorts = await cohortService.list(ctx);
    return NextResponse.json(cohorts);
  } catch (error) {
    console.error("[GET /api/elite/cohorts] Error:", error);
    
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
    const input = createCohortSchema.parse(body);

    const cohort = await cohortService.create(ctx, input);
    return NextResponse.json(cohort, { status: 201 });
  } catch (error) {
    console.error("[POST /api/elite/cohorts] Error:", error);
    
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

