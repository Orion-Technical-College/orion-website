/**
 * LocalStorage utilities for EMC Workspace
 */

const STORAGE_KEYS = {
  PROFILE: "emc-workspace-profile",
  NOTIFICATIONS: "emc-workspace-notifications",
} as const;

export interface UserProfile {
  name: string;
  email: string;
}

export interface NotificationSettings {
  reminderNotifications: boolean;
  campaignCompletionAlerts: boolean;
}

export function getProfile(): UserProfile {
  if (typeof window === "undefined") {
    return { name: "Nicole", email: "nicole@emcsupport.com" };
  }

  const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Invalid JSON, use defaults
    }
  }
  return { name: "Nicole", email: "nicole@emcsupport.com" };
}

export function getNotifications(): NotificationSettings {
  if (typeof window === "undefined") {
    return {
      reminderNotifications: true,
      campaignCompletionAlerts: true,
    };
  }

  const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Invalid JSON, use defaults
    }
  }
  return {
    reminderNotifications: true,
    campaignCompletionAlerts: true,
  };
}

export { STORAGE_KEYS };

