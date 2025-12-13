"use client";

import React, { useState, useEffect } from "react";
import { User, Bell, Shield, Save, Check, Key, Eye, EyeOff, AlertCircle, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getProfile,
  getNotifications,
  STORAGE_KEYS,
  type UserProfile,
  type NotificationSettings,
} from "@/lib/storage";
import { getApiKeys, updateApiKeys, type ApiKeysResponse } from "@/lib/api-keys";

export function SettingsPanel() {
  // Load saved data from localStorage
  const [profile, setProfile] = useState<UserProfile>(getProfile);
  const [notifications, setNotifications] = useState<NotificationSettings>(getNotifications);
  
  // API Keys state (from database)
  const [apiKeys, setApiKeys] = useState<{
    googleMessages: string;
    calendly: string;
    zoom: string;
  }>({
    googleMessages: "",
    calendly: "",
    zoom: "",
  });
  
  const [apiKeysData, setApiKeysData] = useState<ApiKeysResponse | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);

  const [profileSaved, setProfileSaved] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [apiKeysSaved, setApiKeysSaved] = useState(false);
  const [apiKeysSaving, setApiKeysSaving] = useState(false);
  
  // Password visibility toggles
  const [showGoogleMessages, setShowGoogleMessages] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load API keys from database on mount
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        setIsLoadingKeys(true);
        setApiKeysError(null);
        // Uses session-based auth
        const data = await getApiKeys();
        setApiKeysData(data);
        // Only show masked keys if they exist
        setApiKeys({
          googleMessages: data.hasGoogleMessages ? (data.googleMessages || "") : "",
          calendly: data.hasCalendly ? (data.calendly || "") : "",
          zoom: data.hasZoom ? (data.zoom || "") : "",
        });
      } catch (error: any) {
        console.error("Failed to load API keys:", error);
        setApiKeysError(error.message || "Failed to load API keys");
      } finally {
        setIsLoadingKeys(false);
      }
    };

    loadApiKeys();
  }, []);

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

  // Handle password change
  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Failed to change password");
        setPasswordSaving(false);
        return;
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPasswordSuccess(false);
        // Refresh the page to update session
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Failed to change password:", error);
      setPasswordError(error.message || "Failed to change password");
      setPasswordSaving(false);
    }
  };

  // Save API keys to database
  const handleSaveApiKeys = async () => {
    try {
      setApiKeysSaving(true);
      setApiKeysError(null);
      
      // Only send keys that have been changed (non-empty values)
      const keysToUpdate: {
        googleMessages?: string | null;
        calendly?: string | null;
        zoom?: string | null;
      } = {};
      
      // If field is empty, set to null to clear it
      // If field has value and is different from masked version, update it
      if (apiKeys.googleMessages !== apiKeysData?.googleMessages) {
        keysToUpdate.googleMessages = apiKeys.googleMessages || null;
      }
      if (apiKeys.calendly !== apiKeysData?.calendly) {
        keysToUpdate.calendly = apiKeys.calendly || null;
      }
      if (apiKeys.zoom !== apiKeysData?.zoom) {
        keysToUpdate.zoom = apiKeys.zoom || null;
      }

      await updateApiKeys(keysToUpdate);
      
      // Reload keys to get updated masked versions
      const updated = await getApiKeys();
      setApiKeysData(updated);
      setApiKeys({
        googleMessages: updated.hasGoogleMessages ? (updated.googleMessages || "") : "",
        calendly: updated.hasCalendly ? (updated.calendly || "") : "",
        zoom: updated.hasZoom ? (updated.zoom || "") : "",
      });
      
      setApiKeysSaved(true);
      setTimeout(() => setApiKeysSaved(false), 3000);
    } catch (error: any) {
      console.error("Failed to save API keys:", error);
      setApiKeysError(error.message || "Failed to save API keys");
    } finally {
      setApiKeysSaving(false);
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

          {apiKeysError && (
            <div className="bg-status-denied/10 border border-status-denied/30 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-status-denied flex-shrink-0 mt-0.5" />
              <p className="text-xs text-status-denied">{apiKeysError}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              {isLoadingKeys && <span>Loading...</span>}
              {apiKeysSaved && !isLoadingKeys && (
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
              disabled={isLoadingKeys || apiKeysSaving}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {apiKeysSaving ? "Saving..." : "Save API Keys"}
            </Button>
          </div>

          <div className="bg-background-tertiary rounded-md p-3 border border-border">
            <p className="text-xs text-foreground-muted">
              <strong className="text-foreground">Security Note:</strong> API keys are stored securely in the database and encrypted at rest. Each user&apos;s keys are private and not shared with other users. Keep your keys secure and never share them publicly.
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
            Change your password and manage security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Change Password Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Lock className="h-4 w-4 text-foreground-muted" />
              <h3 className="text-sm font-medium">Change Password</h3>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full bg-background-tertiary border border-border rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  disabled={passwordSaving || passwordSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                  disabled={passwordSaving || passwordSuccess}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full bg-background-tertiary border border-border rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  disabled={passwordSaving || passwordSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                  disabled={passwordSaving || passwordSuccess}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-foreground-muted mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full bg-background-tertiary border border-border rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  disabled={passwordSaving || passwordSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                  disabled={passwordSaving || passwordSuccess}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-status-denied/10 border border-status-denied/30 rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-status-denied flex-shrink-0 mt-0.5" />
                <p className="text-xs text-status-denied">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-status-hired/10 border border-status-hired/30 rounded-md p-3 flex items-start gap-2">
                <Check className="h-4 w-4 text-status-hired flex-shrink-0 mt-0.5" />
                <p className="text-xs text-status-hired">Password changed successfully! Refreshing...</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                {passwordSuccess && (
                  <>
                    <Check className="h-3.5 w-3.5 text-status-hired" />
                    <span className="text-status-hired">Password changed</span>
                  </>
                )}
              </div>
              <Button
                onClick={handleChangePassword}
                size="sm"
                className="h-8 text-xs px-3"
                disabled={passwordSaving || passwordSuccess || !currentPassword || !newPassword || !confirmPassword}
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                {passwordSaving ? "Changing..." : passwordSuccess ? "Changed!" : "Change Password"}
              </Button>
            </div>
          </div>

          <div className="bg-background-tertiary rounded-md p-3 border border-border">
            <p className="text-xs text-foreground-muted">
              <strong className="text-foreground">Security Note:</strong> Your data is encrypted and securely stored on Microsoft Azure. Passwords are hashed using bcrypt and never stored in plain text.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

