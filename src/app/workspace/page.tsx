"use client";

/**
 * Workspace Route
 * 
 * Redirects to the workspace selector at /workspaces.
 * This provides a cleaner URL for users navigating to workspace selection.
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function WorkspaceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workspaces");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );
}
