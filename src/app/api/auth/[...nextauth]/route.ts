import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";

const handler = NextAuth(authOptions);

// Ensure proper body parsing for Next.js App Router
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { handler as GET, handler as POST };

