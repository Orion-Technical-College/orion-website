/**
 * Authentication error types and classification
 * Provides structured error handling for authentication flow
 */

export enum AuthErrorType {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  DATABASE_ERROR = "DATABASE_ERROR",
  RATE_LIMIT = "RATE_LIMIT",
  SYSTEM_ERROR = "SYSTEM_ERROR",
  ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",
  SESSION_ERROR = "SESSION_ERROR",
}

export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public originalError?: Error,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Classify an error into an AuthErrorType
 */
export function classifyError(error: unknown): AuthErrorType {
  if (error instanceof AuthError) {
    return error.type;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const errorCode = (error as any).code;

    // Database errors
    if (
      message.includes("database") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("prisma") ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "ECONNREFUSED" ||
      errorCode === "P1001" || // Prisma connection error
      errorCode === "P1002" || // Prisma connection timeout
      errorCode === "P1008"    // Prisma operations timeout
    ) {
      return AuthErrorType.DATABASE_ERROR;
    }

    // Rate limit errors
    if (message.includes("too many") || message.includes("rate limit")) {
      return AuthErrorType.RATE_LIMIT;
    }

    // Session errors
    if (
      message.includes("session") ||
      message.includes("cookie") ||
      message.includes("jwt") ||
      message.includes("token")
    ) {
      return AuthErrorType.SESSION_ERROR;
    }
  }

  return AuthErrorType.SYSTEM_ERROR;
}

/**
 * Create a user-friendly error message based on error type
 */
export function getUserFriendlyMessage(errorType: AuthErrorType): string {
  switch (errorType) {
    case AuthErrorType.INVALID_CREDENTIALS:
      return "Invalid email or password";
    case AuthErrorType.DATABASE_ERROR:
      return "System temporarily unavailable. Please try again in a moment.";
    case AuthErrorType.RATE_LIMIT:
      return "Too many login attempts. Please try again later.";
    case AuthErrorType.ACCOUNT_INACTIVE:
      return "Your account is inactive. Please contact support.";
    case AuthErrorType.SESSION_ERROR:
      return "Session error. Please try logging in again.";
    case AuthErrorType.SYSTEM_ERROR:
    default:
      return "An unexpected error occurred. Please try again.";
  }
}
