import { PrismaClient } from "@prisma/client";

/**
 * Test database connection with safety guards.
 * Throws error if DATABASE_URL doesn't contain "_test" or NODE_ENV !== "test"
 */
export function getTestPrismaClient(): PrismaClient {
  // Safety guard: Ensure we're using a test database
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      `Refusing to run tests against non-test environment. NODE_ENV=${process.env.NODE_ENV}`
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!databaseUrl.includes("_test")) {
    throw new Error(
      `Refusing to run tests against non-test database. DATABASE_URL must contain "_test"`
    );
  }

  // Create Prisma client for tests
  const prisma = new PrismaClient({
    log: process.env.DEBUG ? ["query", "error", "warn"] : ["error"],
  });

  return prisma;
}

// Export singleton instance for tests
const globalForPrisma = globalThis as unknown as {
  testPrisma: PrismaClient | undefined;
};

export const testPrisma =
  globalForPrisma.testPrisma ?? getTestPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.testPrisma = testPrisma;
}

