"use client";

// Check if the browser supports notifications
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

// Check if push messaging is supported
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn("Notifications are not supported in this browser");
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) {
    return null;
  }
  return Notification.permission;
}

// Show a local notification
export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!isNotificationSupported()) {
    console.warn("Notifications are not supported");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  return new Notification(title, {
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    ...options,
  });
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn("Push notifications are not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Get the public VAPID key from environment
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      console.warn("VAPID public key not configured");
      return null;
    }

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    return subscription;
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return false;
  }
}

// Get current push subscription
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Error getting push subscription:", error);
    return null;
  }
}

// Schedule a reminder notification
export function scheduleReminder(
  title: string,
  body: string,
  delayMs: number
): NodeJS.Timeout {
  return setTimeout(() => {
    showNotification(title, {
      body,
      tag: `reminder-${Date.now()}`,
      requireInteraction: true,
    });
  }, delayMs);
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer;
}

// Campaign reminder types
export interface CampaignReminder {
  campaignId: string;
  candidateName: string;
  scheduledTime: Date;
  type: "24h" | "2h";
}

// Schedule campaign reminders
export function scheduleCampaignReminders(
  reminders: CampaignReminder[]
): NodeJS.Timeout[] {
  const now = Date.now();
  const timeouts: NodeJS.Timeout[] = [];

  reminders.forEach((reminder) => {
    const delayMs = reminder.scheduledTime.getTime() - now;

    if (delayMs > 0) {
      const timeout = scheduleReminder(
        `Reminder: ${reminder.candidateName}`,
        `${reminder.type} reminder before scheduled interview`,
        delayMs
      );
      timeouts.push(timeout);
    }
  });

  return timeouts;
}

// Clear all scheduled reminders
export function clearReminders(timeouts: NodeJS.Timeout[]): void {
  timeouts.forEach((timeout) => clearTimeout(timeout));
}

