import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "./helpers/auth";
import * as fs from "fs";
import * as path from "path";

test.describe("CSV Import Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
  });

  test("should upload CSV file and map columns", async ({ page }) => {
    // Navigate to import tab
    await page.click('button:has-text("Import")');
    
    // Create a test CSV file
    const csvContent = `Name,Email,Phone,Job Title
John Doe,john@example.com,123-456-7890,Software Engineer
Jane Smith,jane@example.com,987-654-3210,Product Manager`;
    
    const testCsvPath = path.join(__dirname, "test-candidates.csv");
    fs.writeFileSync(testCsvPath, csvContent);
    
    // Upload CSV file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testCsvPath);
    
    // Wait for parsing to complete
    await page.waitForSelector("text=/mapping|preview/i", { timeout: 10000 });
    
    // Verify columns are auto-mapped
    const nameMapping = page.locator('select:has-text("Name")');
    expect(await nameMapping.count()).toBeGreaterThan(0);
    
    // Clean up test file
    fs.unlinkSync(testCsvPath);
  });

  test("should preview imported candidates", async ({ page }) => {
    // Navigate to import tab
    await page.click('button:has-text("Import")');
    
    // Create and upload CSV (similar to above)
    const csvContent = `Name,Email,Phone
John Doe,john@example.com,123-456-7890`;
    
    const testCsvPath = path.join(__dirname, "test-candidates.csv");
    fs.writeFileSync(testCsvPath, csvContent);
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testCsvPath);
    
    // Wait for mapping step
    await page.waitForSelector("text=/mapping|preview/i", { timeout: 10000 });
    
    // Proceed to preview
    await page.click('button:has-text("Preview")');
    
    // Verify preview shows candidates
    await expect(page.locator("text=/John Doe/i")).toBeVisible({ timeout: 5000 });
    
    // Clean up
    fs.unlinkSync(testCsvPath);
  });

  test("should validate required fields", async ({ page }) => {
    // Navigate to import tab
    await page.click('button:has-text("Import")');
    
    // Create CSV with missing required fields
    const csvContent = `Name,Email
John Doe,john@example.com`; // Missing Phone
    
    const testCsvPath = path.join(__dirname, "test-candidates.csv");
    fs.writeFileSync(testCsvPath, csvContent);
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testCsvPath);
    
    // Wait for validation
    await page.waitForSelector("text=/error|missing|required/i", { timeout: 10000 });
    
    // Should show error for missing required field
    await expect(page.locator("text=/phone|required/i")).toBeVisible();
    
    // Clean up
    fs.unlinkSync(testCsvPath);
  });

  test("should import candidates successfully", async ({ page }) => {
    // Navigate to import tab
    await page.click('button:has-text("Import")');
    
    // Create and upload CSV
    const csvContent = `Name,Email,Phone
John Doe,john@example.com,123-456-7890
Jane Smith,jane@example.com,987-654-3210`;
    
    const testCsvPath = path.join(__dirname, "test-candidates.csv");
    fs.writeFileSync(testCsvPath, csvContent);
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testCsvPath);
    
    // Wait for mapping
    await page.waitForSelector("text=/mapping|preview/i", { timeout: 10000 });
    
    // Proceed to preview
    await page.click('button:has-text("Preview")');
    
    // Confirm import
    await page.click('button:has-text("Import")');
    
    // Should show success message
    await expect(page.locator("text=/imported|success/i")).toBeVisible({ timeout: 5000 });
    
    // Navigate to workspace and verify candidates appear
    await page.click('button:has-text("Workspace")');
    await page.waitForSelector("table", { timeout: 10000 });
    
    // Verify imported candidates are in table
    await expect(page.locator("text=/John Doe/i")).toBeVisible();
    await expect(page.locator("text=/Jane Smith/i")).toBeVisible();
    
    // Clean up
    fs.unlinkSync(testCsvPath);
  });
});

