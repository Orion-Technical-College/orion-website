"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { X, Settings, User, Bell, Shield, LogOut, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/storage";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

function MobileMenuComponent({ isOpen, onClose, onNavigate }: MobileMenuProps) {
  const router = useRouter();
  const [userName, setUserName] = useState(() => getProfile().name);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      setUserName(event.detail.name);
    };

    window.addEventListener("profileUpdated" as any, handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated" as any, handleProfileUpdate);
    };
  }, []);
  
  if (!isOpen) return null;

  const handleNavigate = (tab: string) => {
    if (tab === "docs") {
      router.push("/docs");
      onClose();
    } else {
      onNavigate(tab);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 bg-background-secondary z-50 md:hidden",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-background font-bold">E</span>
            </div>
            <span className="font-semibold text-foreground">EMC Workspace</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center">
              <span className="text-accent font-medium">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-foreground">{userName}</p>
              <p className="text-sm text-foreground-muted">EMC Recruiter</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <button
            onClick={() => handleNavigate("settings")}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-foreground hover:bg-background-tertiary transition-colors"
          >
            <Settings className="h-5 w-5 text-foreground-muted" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => handleNavigate("profile")}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-foreground hover:bg-background-tertiary transition-colors"
          >
            <User className="h-5 w-5 text-foreground-muted" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => handleNavigate("notifications")}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-foreground hover:bg-background-tertiary transition-colors"
          >
            <Bell className="h-5 w-5 text-foreground-muted" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => handleNavigate("security")}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-foreground hover:bg-background-tertiary transition-colors"
          >
            <Shield className="h-5 w-5 text-foreground-muted" />
            <span>Security</span>
          </button>
          <button
            onClick={() => handleNavigate("docs")}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-foreground hover:bg-background-tertiary transition-colors"
          >
            <HelpCircle className="h-5 w-5 text-foreground-muted" />
            <span>Help & Documentation</span>
          </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-status-denied hover:bg-status-denied/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

// Memoize to prevent unnecessary re-renders
export const MobileMenu = React.memo(MobileMenuComponent);
MobileMenu.displayName = "MobileMenu";
