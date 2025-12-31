"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getProfile } from "@/lib/storage";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  FileSpreadsheet,
  Settings,
  MessageSquare,
  HelpCircle,
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string; // Optional - falls back to localStorage if not provided
  showAdmin?: boolean; // Show admin link for Platform Admins
}

const navItems = [
  { id: "workspace", icon: LayoutGrid, label: "Workspace" },
  { id: "campaigns", icon: MessageSquare, label: "Campaigns" },
  { id: "import", icon: FileSpreadsheet, label: "Import" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "docs", icon: HelpCircle, label: "Help" },
];

function SidebarComponent({ activeTab, onTabChange, userName: userNameProp, showAdmin = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Start with empty string to ensure server/client match, then update after mount
  const [userName, setUserName] = useState("");

  // Set userName after component mounts (client-side only)
  // Use prop if provided, otherwise fall back to localStorage profile
  useEffect(() => {
    setMounted(true);
    if (userNameProp) {
      setUserName(userNameProp);
    } else if (typeof window !== "undefined") {
      const profile = getProfile();
      setUserName(profile.name || "User");
    } else {
      setUserName("User");
    }
  }, [userNameProp]);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-background-secondary border-r border-border transition-all duration-200",
        collapsed ? "w-10" : "w-36"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border">
        {!collapsed ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <span className="text-background font-bold text-xs">E</span>
            </div>
            <span className="font-semibold text-foreground text-xs">EMC</span>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <span className="text-background font-bold text-xs">E</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-5 w-5", collapsed && "hidden")}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="px-1 py-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-5 w-5 mx-auto"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-1 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1 rounded transition-all text-[11px]",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-foreground-muted hover:bg-background-tertiary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", isActive && "text-accent")} />
              {!collapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
        {showAdmin && (
          <a
            href="/admin"
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1 rounded transition-all text-[11px]",
              "text-foreground-muted hover:bg-background-tertiary hover:text-foreground"
            )}
          >
            <Shield className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium truncate">Admin</span>
            )}
          </a>
        )}
      </nav>

      {/* User Section */}
      <div className="px-2 py-2 border-t border-border space-y-1">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-1.5")}>
          <div className="w-5 h-5 rounded-full bg-accent-muted flex items-center justify-center">
            <span className="text-accent text-[10px] font-medium">
              {mounted && userName ? userName.charAt(0).toUpperCase() : "U"}
            </span>
          </div>
          {!collapsed && (
            <p className="text-[11px] font-medium text-foreground truncate">
              {mounted && userName ? userName : "User"}
            </p>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1 rounded transition-all text-[11px]",
            "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          )}
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

// Memoize to prevent unnecessary re-renders when props haven't changed
export const Sidebar = React.memo(SidebarComponent);
Sidebar.displayName = "Sidebar";

