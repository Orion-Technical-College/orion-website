#!/usr/bin/env tsx

/**
 * Standalone script to validate configuration
 * Can be run in CI/CD pipeline before deployment
 */

import { validateAuthConfig } from "../src/lib/config-validation";

try {
  validateAuthConfig();
  console.log("✅ Configuration validation passed");
  process.exit(0);
} catch (error: any) {
  console.error("❌ Configuration validation failed:");
  console.error(error.message);
  process.exit(1);
}

