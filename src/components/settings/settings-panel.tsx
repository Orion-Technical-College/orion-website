"use client";

import React, { useState, useEffect } from "react";
import { User, Bell, Shield, Save, Check, Key, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getProfile,
  getNotifications,
  getApiKeys,
  STORAGE_KEYS,
  type UserProfile,
  type NotificationSettings,
  type ApiKeys,
} from "@/lib/storage";

export function SettingsPanel() {
  // Load saved data from localStorage
  const [profile, setProfile] = useState<UserProfile>(getProfile);
  const [notifications, setNotifications] = useState<NotificationSettings>(getNotifications);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(getApiKeys);

  const [profileSaved, setProfileSaved] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [apiKeysSaved, setApiKeysSaved] = useState(false);
  
  // Password visibility toggles
  const [showGoogleMessages, setShowGoogleMessages] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

  // Save profile to localStorage
  const handleSaveProfile = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      // Dispatch custom event to update sidebar
      window.dispatchEvent(new CustomEvent("profileUpdated", { detail: profile }));
    }
  };

  // Save notifications to localStorage (auto-save on change)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      setNotificationsSaved(true);
      const timer = setTimeout(() => setNotificationsSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Save API keys to localStorage
  const handleSaveApiKeys = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(apiKeys));
      setApiKeysSaved(true);
      setTimeout(() => setApiKeysSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl space-y-4 md:space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-accent" />
            Profile
          </CardTitle>
          <CardDescription className="text-sm">
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-1 w-full bg-background-tertiary border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="mt-1 w-full bg-background-tertiary border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              {profileSaved && (
                <>
                  <Check className="h-3.5 w-3.5 text-status-hired" />
                  <span className="text-status-hired">Profile saved</span>
                </>
              )}
            </div>
            <Button
              onClick={handleSaveProfile}
              size="sm"
              className="h-8 text-xs px-3"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-accent" />
            Notifications
          </CardTitle>
          <CardDescription className="text-sm">
            Configure push notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer py-1">
            <span className="text-sm">Reminder notifications</span>
            <div className="flex items-center gap-2">
              {notificationsSaved && (
                <span className="text-xs text-status-hired flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
              <input
                type="checkbox"
                checked={notifications.reminderNotifications}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    reminderNotifications: e.target.checked,
                  })
                }
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer py-1">
            <span className="text-sm">Campaign completion alerts</span>
            <div className="flex items-center gap-2">
              {notificationsSaved && (
                <span className="text-xs text-status-hired flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
              <input
                type="checkbox"
                checked={notifications.campaignCompletionAlerts}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    campaignCompletionAlerts: e.target.checked,
                  })
                }
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </label>
          <p className="text-xs text-foreground-muted pt-2">
            Notification preferences are saved automatically
          </p>
        </CardContent>
      </Card>

      {/* API Keys / Integrations Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-5 w-5 text-accent" />
            API Keys & Integrations
          </CardTitle>
          <CardDescription className="text-sm">
            Connect your Google Messages, Calendly, and Zoom accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Messages API Key */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Google Messages API Key
            </label>
            <div className="relative">
              <input
                type={showGoogleMessages ? "text" : "password"}
                value={apiKeys.googleMessages || ""}
                onChange={(e) => setApiKeys({ ...apiKeys, googleMessages: e.target.value })}
                placeholder="Enter your Google Messages API key"
                className="w-full bg-background-tertiary border border-border rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowGoogleMessages(!showGoogleMessages)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
              >
                {showGoogleMessages ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-foreground-muted mt-1">
              Used for sending SMS messages via Google Messages API
            </p>
          </div>

          {/* Calendly API Key */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Calendly API Key
            </label>
            <div className="relative">
              <input
                type={showCalendly ? "text" : "password"}
                value={apiKeys.calendly || ""}
                onChange={(e) => setApiKeys({ ...apiKeys, calendly: e.target.value })}
                placeholder="Enter your Calendly API key"
                className="w-full bg-background-tertiary border border-border rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowCalendly(!showCalendly)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
              >
                {showCalendly ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-foreground-muted mt-1">
              Used for creating and managing Calendly scheduling links
            </p>
          </div>

          {/* Zoom API Key */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Zoom API Key
            </label>
            <div className="relative">
              <input
                type={showZoom ? "text" : "password"}
                value={apiKeys.zoom || ""}
                onChange={(e) => setApiKeys({ ...apiKeys, zoom: e.target.value })}
                placeholder="Enter your Zoom API key"
                className="w-full bg-background-tertiary border border-border rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowZoom(!showZoom)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
              >
                {showZoom ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-foreground-muted mt-1">
              Used for creating and managing Zoom meeting links
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              {apiKeysSaved && (
                <>
                  <Check className="h-3.5 w-3.5 text-status-hired" />
                  <span className="text-status-hired">API keys saved</span>
                </>
              )}
            </div>
            <Button
              onClick={handleSaveApiKeys}
              size="sm"
              className="h-8 text-xs px-3"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save API Keys
            </Button>
          </div>

          <div className="bg-background-tertiary rounded-md p-3 border border-border">
            <p className="text-xs text-foreground-muted">
              <strong className="text-foreground">Security Note:</strong> API keys are stored locally in your browser and are not shared with other users. Keep your keys secure and never share them publicly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-accent" />
            Security
          </CardTitle>
          <CardDescription className="text-sm">
            Security and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-muted">
            Your data is encrypted and securely stored on Microsoft Azure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

