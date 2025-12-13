import OpenAI from "openai";
import { ConfigurationError } from "@/lib/errors";

console.log("[AZURE_OPENAI] initializing client", {
  hasEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
  hasKey: !!process.env.AZURE_OPENAI_API_KEY,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o (default)"
});

export function validateAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_API_KEY;

  if (!endpoint) {
    throw new ConfigurationError(
      'AZURE_OPENAI_ENDPOINT is not set. Please configure a valid Azure OpenAI endpoint in your environment variables.',
    );
  }

  // Obvious placeholders
  const lowerEndpoint = endpoint.toLowerCase();
  if (
    lowerEndpoint.includes('your-resource') ||
    lowerEndpoint.includes('test.openai.azure.com')
  ) {
    throw new ConfigurationError(
      'AZURE_OPENAI_ENDPOINT is using a placeholder value. Please replace it with your real Azure OpenAI endpoint.',
    );
  }

  if (!key) {
    throw new ConfigurationError(
      'AZURE_OPENAI_API_KEY is not set. Please configure a valid Azure OpenAI API key.',
    );
  }

  if (key === 'test-key' || key.toLowerCase().includes('placeholder')) {
    throw new ConfigurationError(
      'AZURE_OPENAI_API_KEY is using a placeholder value. Please replace it with a real API key.',
    );
  }
}

let azureConfigValid = false;

try {
  if (process.env.NODE_ENV === 'production') {
    validateAzureConfig();
    azureConfigValid = true;
  }
} catch (err) {
  console.error('[AZURE_OPENAI] Configuration validation failed on startup', {
    message: (err as Error).message,
  });
}

export function ensureAzureConfig() {
  if (!azureConfigValid) {
    validateAzureConfig(); // throws ConfigurationError with details
    azureConfigValid = true;
  }
}

/**
 * Shared Azure OpenAI client configuration for the entire app.
 * Single source of truth for Azure OpenAI configuration.
 * 
 * Environment variables required:
 * - AZURE_OPENAI_API_KEY: API key for Azure OpenAI
 * - AZURE_OPENAI_ENDPOINT: Base URL (e.g., https://ai-canvas-openai.openai.azure.com)
 * - AZURE_OPENAI_DEPLOYMENT_NAME: Deployment name (default: "gpt-4o")
 */
export const azureOpenAI = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY || "test-key", // Default for tests
  baseURL: process.env.AZURE_OPENAI_ENDPOINT
    ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o"}`
    : "https://test.openai.azure.com/openai/deployments/gpt-4o", // Default for tests
  defaultQuery: { "api-version": "2024-08-01-preview" },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY || "test-key" },
});
