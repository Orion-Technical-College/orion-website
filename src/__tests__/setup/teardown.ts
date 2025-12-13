import { testPrisma } from "./db";

/**
 * Transaction-based test isolation (preferred).
 * Faster than full truncation, fully isolated.
 * 
 * Usage in tests:
 * ```ts
 * beforeEach(async () => {
 *   await startTransaction();
 * });
 * 
 * afterEach(async () => {
 *   await rollbackTransaction();
 * });
 * ```
 */

let transactionId: string | null = null;

/**
 * Start a transaction for test isolation.
 * All database operations within this transaction will be rolled back.
 */
export async function startTransaction(): Promise<void> {
  // For SQL Server, we can use transactions
  // Note: Prisma doesn't support nested transactions directly
  // This is a simplified version - you may need to adjust based on your SQL Server setup
  try {
    // Start transaction using raw SQL
    await testPrisma.$executeRawUnsafe("BEGIN TRANSACTION");
    transactionId = "test-transaction";
  } catch (error) {
    console.warn("Failed to start transaction, falling back to truncation:", error);
    transactionId = null;
  }
}

/**
 * Rollback the transaction, discarding all changes.
 */
export async function rollbackTransaction(): Promise<void> {
  if (transactionId) {
    try {
      await testPrisma.$executeRawUnsafe("ROLLBACK TRANSACTION");
    } catch (error) {
      console.warn("Failed to rollback transaction:", error);
    } finally {
      transactionId = null;
    }
  }
}

/**
 * Fallback: Clean database between tests if transactions not available.
 * Truncates all tables in a single transaction.
 */
export async function cleanDatabase(): Promise<void> {
  try {
    // Start transaction
    await testPrisma.$executeRawUnsafe("BEGIN TRANSACTION");

    // Truncate tables in dependency order
    await testPrisma.$executeRawUnsafe("DELETE FROM AuditLog");
    await testPrisma.$executeRawUnsafe("DELETE FROM Campaign");
    await testPrisma.$executeRawUnsafe("DELETE FROM Candidate");
    await testPrisma.$executeRawUnsafe("DELETE FROM User");
    await testPrisma.$executeRawUnsafe("DELETE FROM Client");

    // Reset sequences/IDs if using identity columns
    // SQL Server uses IDENTITY columns, so we may need to reseed
    // This is optional and depends on your schema

    // Commit transaction
    await testPrisma.$executeRawUnsafe("COMMIT TRANSACTION");
  } catch (error) {
    // Rollback on error
    try {
      await testPrisma.$executeRawUnsafe("ROLLBACK TRANSACTION");
    } catch (rollbackError) {
      console.error("Failed to rollback after cleanup error:", rollbackError);
    }
    throw error;
  }
}

/**
 * Cleanup function to be called after all tests.
 */
export async function closeTestDatabase(): Promise<void> {
  await testPrisma.$disconnect();
}

