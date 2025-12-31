"use client";

import React from "react";
import { useEliteContext } from "./elite-provider";
import { EliteSidebar } from "./elite-sidebar";

interface EliteShellProps {
  children: React.ReactNode;
}

/**
 * Loading skeleton for the ELITE workspace
 */
function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <aside className="w-56 h-screen bg-background-secondary border-r border-border">
        <div className="h-14 px-4 flex items-center border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-background-tertiary animate-pulse" />
          <div className="ml-2 space-y-1">
            <div className="w-16 h-4 bg-background-tertiary rounded animate-pulse" />
            <div className="w-24 h-2 bg-background-tertiary rounded animate-pulse" />
          </div>
        </div>
        <nav className="p-3 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-9 bg-background-tertiary rounded animate-pulse"
            />
          ))}
        </nav>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-background-tertiary rounded animate-pulse" />
          <div className="h-4 w-64 bg-background-tertiary rounded animate-pulse" />
          <div className="h-64 bg-background-tertiary rounded animate-pulse" />
        </div>
      </main>
    </div>
  );
}

/**
 * Error state for the ELITE workspace
 */
function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex h-screen bg-background items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Unable to Access ELITE Workspace
        </h2>
        <p className="text-foreground-muted mb-4">{error}</p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
        >
          Return to Main Workspace
        </a>
      </div>
    </div>
  );
}

/**
 * ELITE Shell - Main layout wrapper
 */
export function EliteShell({ children }: EliteShellProps) {
  const { context, loading, error } = useEliteContext();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !context) {
    return <ErrorState error={error ?? "ELITE workspace not available"} />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <EliteSidebar context={context} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

