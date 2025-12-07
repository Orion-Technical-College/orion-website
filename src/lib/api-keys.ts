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
 * Get API keys for the current user
 * TODO: Replace with actual authentication token
 */
export async function getApiKeys(userEmail: string): Promise<ApiKeysResponse> {
  const response = await fetch(`/api/user/api-keys?email=${encodeURIComponent(userEmail)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch API keys" }));
    throw new Error(error.error || "Failed to fetch API keys");
  }

  return response.json();
}

/**
 * Update API keys for the current user
 * TODO: Replace with actual authentication token
 */
export async function updateApiKeys(
  userEmail: string,
  keys: UpdateApiKeysRequest
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/user/api-keys?email=${encodeURIComponent(userEmail)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(keys),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update API keys" }));
    throw new Error(error.error || "Failed to update API keys");
  }

  return response.json();
}

