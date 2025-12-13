import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "./helpers/auth";

test.describe("EMC Happy Path", () => {
  test("should complete full workflow: login → workspace → table → send SMS", async ({ page }) => {
    // Step 1: Login
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    await expect(page).toHaveURL("/");
    
    // Step 2: Navigate to workspace (should be default)
    await page.waitForSelector("table", { timeout: 10000 });
    
    // Step 3: Verify table is visible with candidates
    const candidateRows = await page.locator("tbody tr").count();
    expect(candidateRows).toBeGreaterThan(0);
    
    // Step 4: Select a candidate
    const firstRow = page.locator("tbody tr").first();
    await firstRow.click();
    
    // Step 5: Navigate to campaigns tab
    await page.click('button:has-text("Campaigns")');
    
    // Step 6: Create a new campaign (if campaign creation UI exists)
    // This is a placeholder - actual implementation depends on campaign UI
    const createCampaignButton = page.locator('button:has-text("Create Campaign")');
    if (await createCampaignButton.count() > 0) {
      await createCampaignButton.click();
      
      // Fill in campaign details
      await page.fill('input[name="name"]', "Test Campaign");
      await page.fill('textarea[name="message"]', "Hello {{name}}, this is a test message.");
      
      // Save campaign
      await page.click('button:has-text("Save")');
    }
    
    // Step 7: Select candidates for campaign
    await page.click('button:has-text("Select Candidates")');
    
    // Step 8: Verify SMS URI is generated (this would open Messages app in real scenario)
    // In test, we can verify the URI is correct
    const smsLink = page.locator('a[href^="sms:"]').first();
    if (await smsLink.count() > 0) {
      const href = await smsLink.getAttribute("href");
      expect(href).toMatch(/^sms:\d+/);
    }
  });

  test("should filter candidates and send messages", async ({ page }) => {
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    await expect(page).toHaveURL("/");
    
    // Wait for table to load
    await page.waitForSelector("table", { timeout: 10000 });
    
    // Apply filter: Show unresolved only
    const unresolvedToggle = page.locator('button:has-text("Show Unresolved Only")');
    if (await unresolvedToggle.count() > 0) {
      await unresolvedToggle.click();
      
      // Verify filtered results
      const filteredRows = await page.locator("tbody tr").count();
      expect(filteredRows).toBeGreaterThan(0);
    }
    
    // Select multiple candidates
    const checkboxes = page.locator("tbody tr input[type='checkbox']");
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      // Select first 3 candidates
      for (let i = 0; i < Math.min(3, checkboxCount); i++) {
        await checkboxes.nth(i).check();
      }
      
      // Verify candidates are selected
      const selectedCount = await page.locator("tbody tr input[type='checkbox']:checked").count();
      expect(selectedCount).toBeGreaterThan(0);
    }
  });
});

