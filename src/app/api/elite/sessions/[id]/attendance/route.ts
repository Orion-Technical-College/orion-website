/**
 * GET /api/elite/sessions/[id]/attendance - Get attendance for session
 * POST /api/elite/sessions/[id]/attendance - Record attendance
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveEliteContext } from "@/lib/elite/kernel/context";
import { sessionService } from "@/lib/elite/services/session";
import { z } from "zod";

// Validation schema for recording attendance
const recordAttendanceSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]),
  auditNote: z.string().optional(),
});

// Validation schema for bulk attendance
const bulkAttendanceSchema = z.object({
  records: z.array(recordAttendanceSchema),
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
    const attendance = await sessionService.getAttendance(ctx, id);
    return NextResponse.json(attendance);
  } catch (error) {
    console.error("[GET /api/elite/sessions/[id]/attendance] Error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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

    // Check if this is bulk attendance or single
    if (body.records && Array.isArray(body.records)) {
      const input = bulkAttendanceSchema.parse(body);
      const results = await sessionService.recordBulkAttendance(ctx, id, input.records);
      return NextResponse.json(results);
    }

    const input = recordAttendanceSchema.parse(body);
    const attendance = await sessionService.recordAttendance(ctx, id, input);
    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("[POST /api/elite/sessions/[id]/attendance] Error:", error);
    
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

