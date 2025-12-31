"use client";

/**
 * OTC Route (Legacy)
 * 
 * Redirects to /marketing.
 * OTC (Orion Technical College) is a tenant that uses the marketing workspace.
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function OTCRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/marketing");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
    </div>
  );
}
