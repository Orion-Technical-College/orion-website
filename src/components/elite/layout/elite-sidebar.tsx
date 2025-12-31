"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  GraduationCap,
  ClipboardList,
  FileBox,
  BarChart3,
  Settings,
  Layers,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { EliteMeResponse } from "@/lib/elite/kernel/types";

/**
 * Icon mapping for module icons
 */
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  GraduationCap,
  ClipboardList,
  FileBox,
  BarChart3,
  Settings,
};

interface EliteSidebarProps {
  context: EliteMeResponse;
}

/**
 * Navigation item for the sidebar
 */
interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/**
 * Get navigation items based on workspace profile modules
 */
function getNavItems(context: EliteMeResponse): NavItem[] {
  // Default navigation if no profile
  const defaultNav: NavItem[] = [
    { path: "/elite", label: "Dashboard", icon: "LayoutDashboard" },
    { path: "/elite/cohorts", label: "Cohorts", icon: "Users" },
    { path: "/elite/sessions", label: "Sessions", icon: "Calendar" },
  ];

  if (!context.workspaceProfile) {
    return defaultNav;
  }

  // Map modules to nav items
  // In a full implementation, we'd get navigation metadata from the module registry
  const moduleNavMap: Record<string, NavItem> = {
    "elite.dashboard": { path: "/elite", label: "Dashboard", icon: "LayoutDashboard" },
    "elite.cohorts": { path: "/elite/cohorts", label: "Cohorts", icon: "Users" },
    "elite.sessions": { path: "/elite/sessions", label: "Sessions", icon: "Calendar" },
    "elite.coaching": { path: "/elite/coaching", label: "Coaching", icon: "MessageSquare" },
    "elite.learnerProfiles": { path: "/elite/learners", label: "Learners", icon: "GraduationCap" },
    "elite.assignments": { path: "/elite/assignments", label: "Assignments", icon: "ClipboardList" },
    "elite.artifacts": { path: "/elite/artifacts", label: "Artifacts", icon: "FileBox" },
    "elite.analytics": { path: "/elite/analytics", label: "Analytics", icon: "BarChart3" },
    "elite.admin": { path: "/elite/admin", label: "Admin", icon: "Settings" },
  };

  return context.workspaceProfile.modules
    .map((moduleKey) => moduleNavMap[moduleKey])
    .filter((item): item is NavItem => !!item);
}

export function EliteSidebar({ context }: EliteSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(context);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="w-56 h-screen bg-background-secondary border-r border-border flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">ELITE</span>
            <p className="text-[10px] text-foreground-muted leading-tight">
              {context.tenantName}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
          const isActive =
            item.path === "/elite"
              ? pathname === "/elite"
              : pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-foreground truncate">
            {context.user.name}
          </p>
          <p className="text-xs text-foreground-muted truncate">
            {context.effectiveRole}
          </p>
        </div>

        <Link
          href="/workspaces"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
        >
          <Layers className="h-4 w-4" />
          Switch Workspace
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

