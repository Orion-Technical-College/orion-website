/**
 * Validates critical authentication configuration before app startup
 * Logs warnings for configuration issues instead of throwing errors
 * to prevent the app from crashing during startup
 */
export function validateAuthConfig() {
  const warnings: string[] = [];

  if (!process.env.NEXTAUTH_URL) {
    warnings.push("NEXTAUTH_URL is not set - authentication may not work correctly");
  } else {
    // Validate URL format
    try {
      const url = new URL(process.env.NEXTAUTH_URL);
      // Ensure it's HTTPS in production
      if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
        warnings.push("NEXTAUTH_URL should use HTTPS in production");
      }
    } catch {
      warnings.push("NEXTAUTH_URL is not a valid URL");
    }
  }

  if (!process.env.NEXTAUTH_SECRET) {
    warnings.push("NEXTAUTH_SECRET is not set - authentication will not work");
  } else if (process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push(`NEXTAUTH_SECRET is only ${process.env.NEXTAUTH_SECRET.length} characters (recommended: 32+)`);
  }

  if (!process.env.DATABASE_URL) {
    warnings.push("DATABASE_URL is not set - database operations will fail");
  }

  const emailProvider = process.env.EMAIL_PROVIDER;
  if (emailProvider === "azure_communication_services") {
    if (!process.env.ACS_EMAIL_CONNECTION_STRING) {
      warnings.push("ACS_EMAIL_CONNECTION_STRING is missing for Azure Communication Services email");
    }
    if (!process.env.ACS_EMAIL_SENDER_ADDRESS) {
      warnings.push("ACS_EMAIL_SENDER_ADDRESS is missing for Azure Communication Services email");
    }
  }

  if (warnings.length > 0) {
    console.warn("⚠️ Configuration warnings:\n" + warnings.map(w => `  - ${w}`).join("\n"));
  }
}

