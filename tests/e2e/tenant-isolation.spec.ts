import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "./helpers/auth";
import { seedTestDatabase, cleanDatabase } from "@/src/__tests__/setup/seed";
import { prisma } from "@/src/__tests__/setup/db";

test.describe("Tenant Isolation", () => {
  test.beforeAll(async () => {
    // Seed test database with multiple clients and users
    await seedTestDatabase();
  });

  test.afterAll(async () => {
    // Clean up test database
    await cleanDatabase();
    await prisma.$disconnect();
  });

  test("CLIENT_ADMIN should only see candidates from their client", async ({ page }) => {
    await loginWithCredentials(page, "clientadminA@test.com", "Password123!");
    
    await page.goto("/");
    
    // Wait for data table to load
    await page.waitForSelector("table", { timeout: 10000 });
    
    // Get all candidate rows
    const candidateRows = await page.locator("tbody tr").count();
    
    // Should only see candidates from Client A
    // This assumes the seed script creates candidates for Client A
    expect(candidateRows).toBeGreaterThan(0);
    
    // Verify all visible candidates belong to Client A
    const clientNames = await page.locator("tbody tr td:nth-child(3)").allTextContents();
    clientNames.forEach((clientName) => {
      expect(clientName).toContain("Client A");
    });
  });

  test("CLIENT_ADMIN should not see candidates from other clients", async ({ page }) => {
    await loginWithCredentials(page, "clientadminA@test.com", "Password123!");
    
    await page.goto("/");
    
    // Wait for data table to load
    await page.waitForSelector("table", { timeout: 10000 });
    
    // Should not see candidates from Client B
    const clientBNames = await page.locator("tbody tr:has-text('Client B')").count();
    expect(clientBNames).toBe(0);
  });

  test("RECRUITER should see candidates from all clients", async ({ page }) => {
    await loginWithCredentials(page, "recruiter@test.com", "Password123!");
    
    await page.goto("/");
    
    // Wait for data table to load
    await page.waitForSelector("table", { timeout: 10000 });
    
    // Should see candidates from multiple clients
    const candidateRows = await page.locator("tbody tr").count();
    expect(candidateRows).toBeGreaterThan(0);
    
    // Verify candidates from different clients are visible
    const clientNames = await page.locator("tbody tr td:nth-child(3)").allTextContents();
    const uniqueClients = new Set(clientNames);
    expect(uniqueClients.size).toBeGreaterThan(1);
  });

  test("PLATFORM_ADMIN should see candidates from all clients", async ({ page }) => {
    await loginWithCredentials(page, "admin@test.com", "Password123!");
    
    await page.goto("/");
    
    // Wait for data table to load
    await page.waitForSelector("table", { timeout: 10000 });
    
    // Should see candidates from multiple clients
    const candidateRows = await page.locator("tbody tr").count();
    expect(candidateRows).toBeGreaterThan(0);
    
    // Verify candidates from different clients are visible
    const clientNames = await page.locator("tbody tr td:nth-child(3)").allTextContents();
    const uniqueClients = new Set(clientNames);
    expect(uniqueClients.size).toBeGreaterThan(1);
  });

  test("CLIENT_USER should only see candidates from their client (view-only)", async ({ page }) => {
    await loginWithCredentials(page, "clientuserA@test.com", "Password123!");
    
    await page.goto("/");
    
    // Wait for data table to load
    await page.waitForSelector("table", { timeout: 10000 });
    
    // Should only see candidates from Client A
    const candidateRows = await page.locator("tbody tr").count();
    expect(candidateRows).toBeGreaterThan(0);
    
    // Verify all visible candidates belong to Client A
    const clientNames = await page.locator("tbody tr td:nth-child(3)").allTextContents();
    clientNames.forEach((clientName) => {
      expect(clientName).toContain("Client A");
    });
    
    // Should not be able to edit candidates (view-only)
    // This would require checking for edit buttons/actions
    const editButtons = await page.locator('button:has-text("Edit")').count();
    expect(editButtons).toBe(0);
  });
});

