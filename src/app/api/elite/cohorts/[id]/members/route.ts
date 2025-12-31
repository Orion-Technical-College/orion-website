/**
 * GET /api/elite/cohorts/[id]/members - List cohort members
 * POST /api/elite/cohorts/[id]/members - Add member
 * DELETE /api/elite/cohorts/[id]/members - Remove member
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveEliteContext } from "@/lib/elite/kernel/context";
import { cohortService } from "@/lib/elite/services/cohort";
import { z } from "zod";

// Validation schema for adding a member
const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["LEARNER", "COACH", "INSTRUCTOR"]),
});

// Validation schema for importing members
const importMembersSchema = z.object({
  members: z.array(z.object({
    email: z.string().email(),
    role: z.enum(["LEARNER", "COACH", "INSTRUCTOR"]),
  })),
});

// Validation schema for removing a member
const removeMemberSchema = z.object({
  userId: z.string().min(1),
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
    const members = await cohortService.listMembers(ctx, id);
    return NextResponse.json(members);
  } catch (error) {
    console.error("[GET /api/elite/cohorts/[id]/members] Error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (error.message.includes("Access denied")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
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
    
    // Check if this is a bulk import or single add
    if (body.members) {
      const input = importMembersSchema.parse(body);
      const result = await cohortService.importMembers(ctx, id, input.members);
      return NextResponse.json(result);
    }
    
    const input = addMemberSchema.parse(body);
    const member = await cohortService.addMember(ctx, id, input);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("[POST /api/elite/cohorts/[id]/members] Error:", error);
    
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
      if (error.message.includes("already a member")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
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
    const body = await req.json();
    const input = removeMemberSchema.parse(body);

    await cohortService.removeMember(ctx, id, input.userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/elite/cohorts/[id]/members] Error:", error);
    
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

