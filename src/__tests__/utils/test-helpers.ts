import { PrismaClient } from "@prisma/client";
import { SessionUser } from "@/types/auth";

/**
 * Test helper utilities for common test operations.
 */

/**
 * Create a mock Prisma client wrapper for swapping real/mocked client.
 */
export function createMockPrismaClient(): Partial<PrismaClient> {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any,
    candidate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any,
    client: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any,
  };
}

/**
 * Common assertions for test results.
 */
export function expectSuccess(result: any) {
  expect(result).toBeDefined();
  expect(result).not.toHaveProperty("error");
}

export function expectError(result: any, errorMessage?: string) {
  expect(result).toHaveProperty("error");
  if (errorMessage) {
    expect(result.error).toContain(errorMessage);
  }
}

/**
 * Wait for async operations to complete.
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

