"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  FileSpreadsheet,
  Settings,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "workspace", icon: LayoutGrid, label: "Workspace" },
  { id: "campaigns", icon: MessageSquare, label: "Campaigns" },
  { id: "import", icon: FileSpreadsheet, label: "Import" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-background-secondary border-r border-border transition-all duration-200",
        collapsed ? "w-10" : "w-36"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <span className="text-background font-bold text-xs">E</span>
            </div>
            <span className="font-semibold text-foreground text-xs">EMC</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-5 w-5", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

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
      </nav>

      {/* User Section */}
      <div className="px-2 py-2 border-t border-border">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-1.5")}>
          <div className="w-5 h-5 rounded-full bg-accent-muted flex items-center justify-center">
            <span className="text-accent text-[10px] font-medium">N</span>
          </div>
          {!collapsed && (
            <p className="text-[11px] font-medium text-foreground truncate">
              Nicole
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

