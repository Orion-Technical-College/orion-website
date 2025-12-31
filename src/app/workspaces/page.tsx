"use client";

/**
 * Workspaces Page
 * 
 * Central hub for users to select and navigate to different workspaces.
 * Displays workspace cards with richer naming per plan:
 * - Title: workspaceName
 * - Subtitle: tenantName (when different from workspace name)
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { 
  Users, 
  GraduationCap, 
  BarChart3, 
  Settings,
  ChevronRight,
  Building2,
  LogOut,
  Loader2,
  Megaphone
} from "lucide-react";

interface WorkspaceOption {
  id: string;
  key: string;
  platformName: string;
  tenantName: string;
  workspaceName: string;
  description: string;
  icon: "users" | "graduation" | "chart" | "building" | "megaphone";
  href: string;
  color: string;
  available: boolean;
  badge?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  graduation: GraduationCap,
  chart: BarChart3,
  building: Building2,
  megaphone: Megaphone,
};

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
  cyan: {
    bg: "from-cyan-500/10 to-cyan-600/5",
    border: "border-cyan-500/30 hover:border-cyan-400/60",
    icon: "text-cyan-400",
    glow: "group-hover:shadow-cyan-500/20",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-500/30 hover:border-purple-400/60",
    icon: "text-purple-400",
    glow: "group-hover:shadow-purple-500/20",
  },
  emerald: {
    bg: "from-emerald-500/10 to-emerald-600/5",
    border: "border-emerald-500/30 hover:border-emerald-400/60",
    icon: "text-emerald-400",
    glow: "group-hover:shadow-emerald-500/20",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/30 hover:border-amber-400/60",
    icon: "text-amber-400",
    glow: "group-hover:shadow-amber-500/20",
  },
};

function WorkspaceCard({ workspace }: { workspace: WorkspaceOption }) {
  // Safely get icon with fallback - use type assertion to handle dynamic key lookup
  const iconKey = workspace.icon as keyof typeof ICON_MAP;
  const Icon = ICON_MAP[iconKey] ?? Building2;
  const colors = COLOR_MAP[workspace.color] || COLOR_MAP.cyan;
  
  // Safety check - if Icon is still undefined, use Building2
  const SafeIcon = Icon || Building2;

  // Show tenant name as subtitle if different from workspace name
  const showTenantSubtitle = workspace.tenantName !== workspace.workspaceName && 
                              workspace.tenantName !== "EMC Platform";

  if (!workspace.available) {
    return (
      <div className="relative group">
        <div className={`
          relative overflow-hidden rounded-xl border bg-gradient-to-br opacity-50 cursor-not-allowed
          ${colors.bg} border-zinc-700/50
          p-6 transition-all duration-300
        `}>
          <div className="flex items-start gap-4">
            <div className={`
              w-14 h-14 rounded-xl bg-zinc-800/80 flex items-center justify-center
              border border-zinc-700/50
            `}>
              <SafeIcon className="w-7 h-7 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-zinc-500">{workspace.workspaceName}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
                  Not Available
                </span>
              </div>
              {showTenantSubtitle && (
                <p className="text-xs text-zinc-600 mb-1">{workspace.tenantName}</p>
              )}
              <p className="text-sm text-zinc-600 line-clamp-2">{workspace.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={workspace.href}
      className="relative group w-full text-left block"
    >
      <div className={`
        relative overflow-hidden rounded-xl border bg-gradient-to-br
        ${colors.bg} ${colors.border}
        p-6 transition-all duration-300
        group-hover:shadow-lg ${colors.glow}
        group-hover:translate-y-[-2px]
      `}>
        {/* Decorative corner accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${colors.bg} opacity-50 rounded-bl-full`} />
        
        <div className="relative flex items-start gap-4">
          <div className={`
            w-14 h-14 rounded-xl bg-zinc-900/80 flex items-center justify-center
            border border-zinc-700/50 group-hover:border-zinc-600
            transition-all duration-300 group-hover:scale-105
          `}>
            <SafeIcon className={`w-7 h-7 ${colors.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-white transition-colors">
                {workspace.workspaceName || workspace.tenantName || `Workspace ${workspace.id}`}
              </h3>
              {workspace.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full bg-zinc-800/80 ${colors.icon} border border-zinc-700/50`}>
                  {workspace.badge}
                </span>
              )}
            </div>
            {showTenantSubtitle && (
              <p className="text-xs text-zinc-500 mb-1">{workspace.tenantName}</p>
            )}
            <p className="text-sm text-zinc-400 line-clamp-2 group-hover:text-zinc-300 transition-colors">
              {workspace.description}
            </p>
          </div>
          <ChevronRight className={`
            w-5 h-5 text-zinc-600 group-hover:text-zinc-400 
            transition-all duration-300 group-hover:translate-x-1
          `} />
        </div>
      </div>
    </Link>
  );
}

export default function WorkspacesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchWorkspaces();
    }
  }, [status, router]);

  async function fetchWorkspaces() {
    try {
      // Fetch with no-store to prevent browser caching
      const response = await fetch("/api/workspaces", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);
      } else {
        // Fallback to default workspaces
        setWorkspaces(getDefaultWorkspaces());
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
      setWorkspaces(getDefaultWorkspaces());
    } finally {
      setLoading(false);
    }
  }

  function getDefaultWorkspaces(): WorkspaceOption[] {
    const tenantName = session?.user?.name || "EMC Platform";
    return [
      {
        id: "recruiter",
        key: "DEFAULT",
        platformName: "EMC Recruiter",
        tenantName: tenantName,
        workspaceName: "EMC Recruiter",
        description: "Recruiter workflow automation with AI-powered candidate management and SMS campaigns",
        icon: "users",
        href: "/recruiter",
        color: "cyan",
        available: true,
      },
      {
        id: "marketing",
        key: "MARKETING",
        platformName: "Marketing",
        tenantName: tenantName,
        workspaceName: "Marketing",
        description: "SMS campaigns, email marketing, and outreach automation",
        icon: "chart", // Using chart instead of megaphone temporarily
        href: "/marketing",
        color: "emerald",
        available: true,
      },
      {
        id: "elite",
        key: "ELITE",
        platformName: "ELITE Leadership",
        tenantName: tenantName,
        workspaceName: "ELITE Leadership",
        description: "Cohort operations, learner engagement, coaching, and outcomes analytics",
        icon: "graduation",
        href: "/elite",
        color: "purple",
        available: session?.user?.clientId ? true : false,
        badge: "New",
      },
    ];
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-zinc-400 text-sm">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
      
      <div className="relative">
        {/* Header */}
        <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">EMC Platform</h1>
                <p className="text-xs text-zinc-500">Select a workspace</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-zinc-200">{session?.user?.name}</p>
                <p className="text-xs text-zinc-500">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back, {session?.user?.name?.split(" ")[0]}
            </h2>
            <p className="text-zinc-400 text-lg">
              Choose a workspace to get started
            </p>
          </div>

          {/* Workspace grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
              />
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-12 pt-8 border-t border-zinc-800/50">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/recruiter")}
                className="px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-sm text-zinc-300 hover:text-white transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                View Candidates
              </button>
              {session?.user?.clientId && (
                <button
                  onClick={() => router.push("/elite/cohorts")}
                  className="px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-sm text-zinc-300 hover:text-white transition-all flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  Manage Cohorts
                </button>
              )}
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-sm text-zinc-300 hover:text-white transition-all flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Admin Settings
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 mt-20">
          <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-zinc-600">
            <p>EMC Workspace Platform</p>
            <p>v2.0.0</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
