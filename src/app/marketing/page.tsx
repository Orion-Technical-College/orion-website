"use client";

/**
 * Marketing Workspace
 * 
 * Marketing automation workspace for SMS campaigns, outreach, and engagement.
 * Used by tenants like OTC (Orion Technical College).
 */

import { WORKSPACE_KEYS } from "@/lib/workspace";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Megaphone, Mail, MessageSquare, BarChart3, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MarketingWorkspacePage() {
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
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/30 via-zinc-950 to-zinc-950" />
      
      <div className="relative">
        {/* Header */}
        <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/workspaces"
                className="p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Marketing Workspace</h1>
                  <p className="text-xs text-zinc-500">workspaceKey: {WORKSPACE_KEYS.MARKETING}</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-200">{session.user?.name}</p>
              <p className="text-xs text-zinc-500">{session.user?.email}</p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">
              Marketing Automation
            </h2>
            <p className="text-zinc-400 text-lg">
              SMS campaigns, outreach automation, and engagement analytics
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* SMS Campaigns */}
            <div className="group relative overflow-hidden rounded-xl border border-emerald-500/30 hover:border-emerald-400/60 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900/80 flex items-center justify-center border border-zinc-700/50">
                  <MessageSquare className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1">SMS Campaigns</h3>
                  <p className="text-sm text-zinc-400">Create and manage SMS outreach campaigns</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <p className="text-xs text-zinc-500">Coming soon</p>
              </div>
            </div>

            {/* Email Marketing */}
            <div className="group relative overflow-hidden rounded-xl border border-emerald-500/30 hover:border-emerald-400/60 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900/80 flex items-center justify-center border border-zinc-700/50">
                  <Mail className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1">Email Marketing</h3>
                  <p className="text-sm text-zinc-400">Email templates and drip campaigns</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <p className="text-xs text-zinc-500">Coming soon</p>
              </div>
            </div>

            {/* Analytics */}
            <div className="group relative overflow-hidden rounded-xl border border-emerald-500/30 hover:border-emerald-400/60 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900/80 flex items-center justify-center border border-zinc-700/50">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1">Analytics</h3>
                  <p className="text-sm text-zinc-400">Campaign performance and engagement metrics</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <p className="text-xs text-zinc-500">Coming soon</p>
              </div>
            </div>

            {/* Settings */}
            <div className="group relative overflow-hidden rounded-xl border border-zinc-700/50 hover:border-zinc-600/60 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 p-6 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900/80 flex items-center justify-center border border-zinc-700/50">
                  <Settings className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1">Settings</h3>
                  <p className="text-sm text-zinc-400">Configure workspace preferences</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

