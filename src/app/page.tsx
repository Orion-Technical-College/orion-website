import { redirect } from "next/navigation";

/**
 * Root Route
 * 
 * Redirects to the workspace selector at /workspaces.
 */

export default function RootRedirectPage() {
  redirect("/workspaces");
}
