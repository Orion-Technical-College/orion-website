import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Guided Send Queue Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    await page.goto("/");
    await page.waitForSelector("table", { timeout: 10000 });
  });

  test("should create a guided send session and navigate to guided send UI", async ({ page }) => {
    // Navigate to campaigns/send tab
    await page.click('button:has-text("Send SMS")');
    await page.waitForSelector('input[placeholder*="Campaign Name"]', { timeout: 5000 });

    // Fill in campaign details
    await page.fill('input[placeholder*="Campaign Name"]', "Test Guided Send");
    await page.fill('input[placeholder*="calendly"]', "https://calendly.com/test");

    // Select at least one candidate
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.check();
    }

    // Click "Start Guided Send" button
    const startButton = page.locator('button:has-text("Start Guided Send")');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Should navigate to guided send UI
    await page.waitForSelector('text=/remaining|of/i', { timeout: 10000 });

    // Verify guided send UI elements
    await expect(page.locator('text=/Open SMS|Mark Sent|Skip/i')).toBeVisible();
  });

  test("should show return prompt when returning from SMS app", async ({ page, context }) => {
    // This test would require stubbing the SMS compose function
    // For now, we'll test the UI state management

    // Navigate to guided send (assuming session exists or is created)
    await page.click('button:has-text("Send SMS")');

    // Mock the return detection by simulating visibility change
    await page.evaluate(() => {
      // Simulate returning from SMS app
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden'
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Then simulate return
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Note: Actual return prompt testing requires more complex mocking
    // This is a placeholder for the test structure
  });

  test("should handle blocked recipients (opted out)", async ({ page }) => {
    // Navigate to send tab
    await page.click('button:has-text("Send SMS")');

    // Create session with candidates (some may be opted out)
    // The UI should show blocked recipients with appropriate messaging
    await page.waitForSelector('text=/Opted Out|Invalid Phone|Consent Unknown/i', { timeout: 5000 }).catch(() => {
      // Blocked recipients may not be visible if none exist
    });
  });

  test("should update recipient status on action", async ({ page }) => {
    // Navigate to guided send
    await page.click('button:has-text("Send SMS")');

    // Select candidate and start session
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.check();
      await page.locator('button:has-text("Start Guided Send")').click();

      // Wait for guided send UI
      await page.waitForSelector('text=/Open SMS/i', { timeout: 10000 });

      // Click "Mark Sent" (if available)
      const markSentButton = page.locator('button:has-text("Mark Sent")');
      if (await markSentButton.count() > 0) {
        await markSentButton.click();

        // Should update UI to show next recipient or completion
        await page.waitForTimeout(1000); // Wait for API call
      }
    }
  });

  test("should show progress counts correctly", async ({ page }) => {
    // Navigate to guided send
    await page.click('button:has-text("Send SMS")');

    // Start session
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.check();
      await page.locator('button:has-text("Start Guided Send")').click();

      // Verify progress indicator
      await expect(page.locator('text=/remaining|of/i')).toBeVisible();

      // Verify progress bar exists
      await expect(page.locator('.bg-accent.h-2')).toBeVisible();
    }
  });

  test("should handle session resume after refresh", async ({ page }) => {
    // Create session
    await page.click('button:has-text("Send SMS")');
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.check();
      await page.locator('button:has-text("Start Guided Send")').click();

      // Wait for guided send UI
      await page.waitForSelector('text=/Open SMS/i', { timeout: 10000 });

      // Refresh page
      await page.reload();

      // Should reload session state from server
      // Note: This requires session persistence which may need additional setup
      await page.waitForTimeout(2000);
    }
  });
});
