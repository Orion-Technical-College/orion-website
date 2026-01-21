/**
 * Database query retry logic with exponential backoff
 * Handles transient database connection errors
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  retryableErrors: [
    "ETIMEDOUT",
    "ECONNREFUSED",
    "P1001", // Prisma connection error
    "P1002", // Prisma connection timeout
    "P1008", // Prisma operations timeout
    "P1017", // Prisma server closed connection
  ],
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorCode = (error as any).code;
  const errorMessage = error.message.toLowerCase();

  // Check error code
  if (errorCode && retryableErrors.includes(errorCode)) {
    return true;
  }

  // Check error message for retryable patterns
  const retryablePatterns = [
    "connection",
    "timeout",
    "network",
    "temporarily unavailable",
    "econnrefused",
    "etimedout",
  ];

  return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, initialDelay: number, maxDelay: number): number {
  const delay = initialDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Execute a database query with retry logic
 * @param queryFn - Function that returns a Promise with the query result
 * @param options - Retry configuration options
 * @returns Promise with query result
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        throw lastError;
      }

      // Check if error is retryable
      if (!isRetryableError(error, config.retryableErrors)) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, config.initialDelayMs, config.maxDelayMs);
      
      // Log retry attempt (in production, use structured logging)
      if (process.env.NODE_ENV !== "production" || process.env.ENABLE_AUTH_DEBUG === "true") {
        console.warn(
          `[DB Retry] Attempt ${attempt + 1}/${config.maxRetries + 1} failed, retrying in ${delay}ms:`,
          lastError.message
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Query failed after retries");
}
