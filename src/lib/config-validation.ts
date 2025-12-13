/**
 * Validates critical authentication configuration before app startup
 * Throws error if configuration is invalid
 */
export function validateAuthConfig() {
  const errors: string[] = [];

  if (!process.env.NEXTAUTH_URL) {
    errors.push("NEXTAUTH_URL is required");
  } else {
    // Validate URL format
    try {
      const url = new URL(process.env.NEXTAUTH_URL);
      // Ensure it's HTTPS in production
      if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
        errors.push("NEXTAUTH_URL must use HTTPS in production");
      }
    } catch {
      errors.push("NEXTAUTH_URL must be a valid URL");
    }
  }

  if (!process.env.NEXTAUTH_SECRET) {
    errors.push("NEXTAUTH_SECRET is required");
  } else if (process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push("NEXTAUTH_SECRET must be at least 32 characters");
  }

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
  }
}

