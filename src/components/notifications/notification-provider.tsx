"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  isNotificationSupported,
  isPushSupported,
  requestNotificationPermission,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
} from "@/lib/notifications";

interface NotificationContextType {
  isSupported: boolean;
  isPushSupported: boolean;
  permission: NotificationPermission | null;
  subscription: PushSubscription | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supported, setSupported] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  // Initialize notification state
  useEffect(() => {
    const init = async () => {
      setSupported(isNotificationSupported());
      setPushSupported(isPushSupported());
      setPermission(getNotificationPermission());

      if (isPushSupported()) {
        const sub = await getPushSubscription();
        setSubscription(sub);
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    const perm = await requestNotificationPermission();
    setPermission(perm);
    setIsLoading(false);
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    const sub = await subscribeToPush();
    setSubscription(sub);

    // In a real app, you'd send this subscription to your server
    if (sub) {
      console.log("Push subscription:", JSON.stringify(sub.toJSON()));
      // TODO: Send to server via API call
    }

    setIsLoading(false);
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    await unsubscribeFromPush();
    setSubscription(null);
    setIsLoading(false);
  }, []);

  const value: NotificationContextType = {
    isSupported: supported,
    isPushSupported: pushSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

