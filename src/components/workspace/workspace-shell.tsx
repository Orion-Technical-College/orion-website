/**
 * WorkspaceShell - Server Component
 * 
 * The single composition choke point for workspace rendering.
 * Takes a workspaceKey and resolves the appropriate workspace UI.
 * 
 * Per plan: WorkspaceShell is a Server Component that resolves profile
 * server-side, avoids leaking sensitive data, and ensures each workspace
 * has a distinct identity.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  type WorkspaceKey, 
  WORKSPACE_KEYS, 
  isValidWorkspaceKey,
} from "@/lib/workspace/types";
import { RecruiterWorkspace } from "./recruiter-workspace";

interface WorkspaceShellProps {
  workspaceKey: WorkspaceKey;
}

/**
 * Resolve workspace display metadata server-side
 */
async function resolveWorkspaceDisplay(
  workspaceKey: WorkspaceKey,
  clientId: string | null
) {
  let tenantName = "EMC Platform";
  
  if (clientId) {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { name: true },
      });
      if (client) {
        tenantName = client.name;
      }
    } catch {
      // Fallback to default
    }
  }

  // Determine display based on workspace key
  switch (workspaceKey) {
    case WORKSPACE_KEYS.OTC:
      return {
        title: tenantName,
        subtitle: "Recruiter workflow automation with AI-powered candidate management",
        workspaceKey,
      };
    case WORKSPACE_KEYS.EMC:
    case WORKSPACE_KEYS.DEFAULT:
    default:
      return {
        title: "EMC Workspace",
        subtitle: "Recruiter workflow automation with AI-powered candidate management",
        workspaceKey,
      };
  }
}

/**
 * WorkspaceShell - Server Component
 * 
 * Resolves workspace context and renders the appropriate workspace
 * with distinct identity based on workspaceKey.
 */
export async function WorkspaceShell({ workspaceKey }: WorkspaceShellProps) {
  // Validate workspace key
  if (!isValidWorkspaceKey(workspaceKey)) {
    redirect("/workspaces");
  }

  // ELITE workspace has its own dedicated implementation
  if (workspaceKey === WORKSPACE_KEYS.ELITE) {
    redirect("/elite");
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Resolve workspace display
  const display = await resolveWorkspaceDisplay(workspaceKey, user.clientId || null);

  // Render the recruiter workspace with proper identity
  // The key ensures React treats different workspaces as different component trees
  return (
    <RecruiterWorkspace 
      key={workspaceKey}
      workspaceKey={workspaceKey}
      title={display.title}
      subtitle={display.subtitle}
      userName={user.name || "User"}
      userRole={user.role}
    />
  );
}
