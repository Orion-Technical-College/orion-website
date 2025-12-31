"use client";

/**
 * EMC Workspace Route
 * 
 * EMC workspace with workspaceKey="EMC".
 * This ensures route identity is distinct from other workspaces.
 */

import { RecruiterWorkspace } from "@/components/workspace/recruiter-workspace";
import { WORKSPACE_KEYS } from "@/lib/workspace";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function EMCWorkspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <RecruiterWorkspace 
      key={WORKSPACE_KEYS.EMC}
      workspaceKey={WORKSPACE_KEYS.EMC}
      title="EMC Workspace"
      subtitle="Recruiter workflow automation with AI-powered candidate management"
      userName={session.user?.name || "User"}
      userRole={session.user?.role || ""}
    />
  );
}
