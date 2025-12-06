"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  MessageSquare,
  FileSpreadsheet,
  Menu,
  Sparkles,
} from "lucide-react";

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuOpen: () => void;
  onAIOpen: () => void;
}

const navItems = [
  { id: "workspace", icon: LayoutGrid, label: "Workspace" },
  { id: "campaigns", icon: MessageSquare, label: "Campaigns" },
  { id: "import", icon: FileSpreadsheet, label: "Import" },
];

export function MobileNav({ activeTab, onTabChange, onMenuOpen, onAIOpen }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        {/* Menu Button */}
        <button
          onClick={onMenuOpen}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>

        {/* Main Nav Items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors",
                isActive
                  ? "text-accent bg-accent-muted"
                  : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* AI Button */}
        <button
          onClick={onAIOpen}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-foreground-muted hover:text-accent hover:bg-accent-muted transition-colors"
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">AI</span>
        </button>
      </div>
    </nav>
  );
}

