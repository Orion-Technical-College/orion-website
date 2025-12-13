/**
 * API utilities for managing user API keys
 */

export interface ApiKeysResponse {
  googleMessages: string | null;
  calendly: string | null;
  zoom: string | null;
  hasGoogleMessages: boolean;
  hasCalendly: boolean;
  hasZoom: boolean;
}

export interface UpdateApiKeysRequest {
  googleMessages?: string | null;
  calendly?: string | null;
  zoom?: string | null;
}

/**
 * Get API keys for the current user (uses session-based auth)
 */
export async function getApiKeys(): Promise<ApiKeysResponse> {
  const response = await fetch(`/api/user/api-keys`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch API keys" }));
    throw new Error(error.error || "Failed to fetch API keys");
  }

  return response.json();
}

/**
 * Update API keys for the current user (uses session-based auth)
 */
export async function updateApiKeys(
  keys: UpdateApiKeysRequest
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/user/api-keys`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(keys),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update API keys" }));
    throw new Error(error.error || "Failed to update API keys");
  }

  return response.json();
}

