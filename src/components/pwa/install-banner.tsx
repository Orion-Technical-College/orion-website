"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "./pwa-provider";

export function InstallBanner() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const wasDismissed = localStorage.getItem("pwa-banner-dismissed");
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }

    // Delay showing the banner to not interrupt initial load
    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  const handleInstall = async () => {
    await installApp();
  };

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || dismissed || !isInstallable || !show) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background-secondary border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground">Install EMC Workspace</h3>
            <p className="text-xs text-foreground-muted mt-1">
              Add to your home screen for quick access and offline support.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={handleInstall} className="h-8 text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 text-xs text-foreground-muted"
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
