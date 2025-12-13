import { Langfuse } from "langfuse";

/**
 * Langfuse client singleton
 * Handles initialization and graceful degradation if Langfuse is not configured
 */
let langfuseClient: Langfuse | null = null;
let isInitialized = false;

/**
 * Initialize Langfuse client if credentials are available
 */
function initializeLangfuse(): Langfuse | null {
  if (isInitialized) {
    return langfuseClient;
  }

  isInitialized = true;

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const host = process.env.LANGFUSE_HOST; // Optional, defaults to cloud

  // Only initialize if both keys are provided
  if (!publicKey || !secretKey) {
    console.log("[LANGFUSE] Not configured - missing API keys. Langfuse tracing will be disabled.");
    return null;
  }

  try {
    const config: {
      publicKey: string;
      secretKey: string;
      baseUrl?: string;
    } = {
      publicKey,
      secretKey,
    };

    // Always set baseUrl if provided (required for US cloud region)
    if (host) {
      config.baseUrl = host;
    }

    langfuseClient = new Langfuse(config);
    console.log("[LANGFUSE] Initialized successfully", { host: host || "default (cloud.langfuse.com)" });
    return langfuseClient;
  } catch (error) {
    console.error("[LANGFUSE] Failed to initialize:", error);
    return null;
  }
}

/**
 * Get Langfuse client instance
 * Returns null if not configured (graceful degradation)
 */
export function getLangfuseClient(): Langfuse | null {
  if (!langfuseClient && !isInitialized) {
    return initializeLangfuse();
  }
  return langfuseClient;
}

/**
 * Check if Langfuse is available
 */
export function isLangfuseAvailable(): boolean {
  return getLangfuseClient() !== null;
}

/**
 * Flush pending events (useful for serverless environments)
 */
export async function flushLangfuse(): Promise<void> {
  const client = getLangfuseClient();
  if (client) {
    try {
      await client.flushAsync();
    } catch (error) {
      console.error("[LANGFUSE] Failed to flush:", error);
    }
  }
}
