"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { EliteMeResponse } from "@/lib/elite/kernel/types";

/**
 * ELITE Context for client components
 */
interface EliteContextValue {
  context: EliteMeResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const EliteContext = createContext<EliteContextValue | null>(null);

/**
 * Hook to access ELITE context
 */
export function useEliteContext(): EliteContextValue {
  const ctx = useContext(EliteContext);
  if (!ctx) {
    throw new Error("useEliteContext must be used within EliteProvider");
  }
  return ctx;
}

/**
 * Hook to require ELITE context (throws if not loaded)
 */
export function useRequiredEliteContext(): EliteMeResponse {
  const { context, loading, error } = useEliteContext();
  
  if (loading) {
    throw new Error("ELITE context is still loading");
  }
  
  if (error) {
    throw new Error(`ELITE context error: ${error}`);
  }
  
  if (!context) {
    throw new Error("ELITE context not available");
  }
  
  return context;
}

/**
 * Check if user has a specific permission
 */
export function useElitePermission(permission: string): boolean {
  const { context } = useEliteContext();
  return context?.effectivePermissions.includes(permission as any) ?? false;
}

/**
 * Check if a feature flag is enabled
 */
export function useEliteFeatureFlag(flag: string): boolean {
  const { context } = useEliteContext();
  return context?.featureFlags[flag] ?? false;
}

interface EliteProviderProps {
  children: React.ReactNode;
  /** Initial context from server (optional for SSR hydration) */
  initialContext?: EliteMeResponse | null;
}

/**
 * ELITE Context Provider
 * Fetches and provides ELITE context to all child components
 */
export function EliteProvider({ children, initialContext }: EliteProviderProps) {
  const [context, setContext] = useState<EliteMeResponse | null>(initialContext ?? null);
  const [loading, setLoading] = useState(!initialContext);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/elite/me");
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required");
        }
        if (response.status === 403) {
          throw new Error("ELITE workspace access denied");
        }
        throw new Error(`Failed to fetch ELITE context: ${response.status}`);
      }

      const data = await response.json();
      setContext(data);
    } catch (err) {
      console.error("[EliteProvider] Error fetching context:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setContext(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialContext) {
      fetchContext();
    }
  }, [initialContext]);

  const value: EliteContextValue = {
    context,
    loading,
    error,
    refresh: fetchContext,
  };

  return (
    <EliteContext.Provider value={value}>
      {children}
    </EliteContext.Provider>
  );
}

