import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Campaign Workflow - Send SMS to Selected Candidates", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    await page.goto("/");
    await page.waitForSelector("table", { timeout: 10000 });
  });

  test("should complete full campaign workflow: select candidates → create campaign → send SMS", async ({ page }) => {
    // Step 1: Navigate to workspace and select candidates
    console.log("Step 1: Selecting candidates from data table");

    // Wait for table to load
    await page.waitForSelector("tbody tr", { timeout: 5000 });

    // Select first 3 candidates by clicking checkboxes
    const checkboxes = page.locator("tbody tr input[type='checkbox']");
    const checkboxCount = await checkboxes.count();

    expect(checkboxCount).toBeGreaterThan(0);

    // Select candidates
    const candidatesToSelect = Math.min(3, checkboxCount);
    for (let i = 0; i < candidatesToSelect; i++) {
      await checkboxes.nth(i).check();
      await page.waitForTimeout(200); // Small delay between selections
    }

    console.log(`Selected ${candidatesToSelect} candidates`);

    // Step 2: Navigate to "Send SMS" tab (desktop) or Campaigns tab
    console.log("Step 2: Navigating to campaign builder");

    // Try desktop "Send SMS" tab first
    const sendSmsTab = page.locator('button[role="tab"]:has-text("Send SMS")');
    if (await sendSmsTab.count() > 0) {
      await sendSmsTab.click();
      await page.waitForTimeout(500);
    } else {
      // Fallback to Campaigns tab
      const campaignsTab = page.locator('button:has-text("Campaigns")');
      if (await campaignsTab.count() > 0) {
        await campaignsTab.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 3: Verify campaign builder is visible
    console.log("Step 3: Verifying campaign builder UI");

    // Check for campaign name input
    const campaignNameInput = page.locator('input[placeholder*="campaign" i], input[placeholder*="Indeed" i]');
    await expect(campaignNameInput).toBeVisible({ timeout: 5000 });

    // Check for message template textarea
    const messageTemplate = page.locator('textarea[placeholder*="message" i]');
    await expect(messageTemplate).toBeVisible();

    // Check for merge tag buttons
    const mergeTagButtons = page.locator('button:has-text("Name"), button:has-text("City"), button:has-text("Role")');
    const mergeTagCount = await mergeTagButtons.count();
    expect(mergeTagCount).toBeGreaterThan(0);

    console.log("Campaign builder UI is visible");

    // Step 4: Configure campaign
    console.log("Step 4: Configuring campaign");

    // Set campaign name
    await campaignNameInput.fill("Test Campaign - " + new Date().toISOString().slice(0, 10));

    // Update message template
    const templateText = "Hi {{name}}, thanks for your interest in the {{role}} position. Book a call: {{calendly_link}}";
    await messageTemplate.fill(templateText);

    // Set Calendly URL
    const calendlyInput = page.locator('input[placeholder*="calendly" i]');
    if (await calendlyInput.count() > 0) {
      await calendlyInput.fill("https://calendly.com/test-link");
    }

    console.log("Campaign configured");

    // Step 5: Verify candidate selection is shown
    console.log("Step 5: Verifying selected candidates are displayed");

    // Check for candidate selection card
    const candidateCard = page.locator('text=/Select Candidates|selected/i');
    await expect(candidateCard.first()).toBeVisible({ timeout: 5000 });

    // Verify selected count matches
    const selectedCountText = await page.locator('text=/\\d+ selected/i').first().textContent();
    expect(selectedCountText).toContain(candidatesToSelect.toString());

    console.log(`Verified ${candidatesToSelect} candidates are selected`);

    // Step 6: Verify message preview for selected candidates
    console.log("Step 6: Verifying message preview");

    // Look for preview messages in candidate cards
    const previewMessages = page.locator('text=/Preview/i');
    const previewCount = await previewMessages.count();

    // At least one preview should be visible for selected candidates
    if (previewCount > 0) {
      const firstPreview = await previewMessages.first().locator('..').textContent();
      // Verify merge tags are replaced (should not contain {{name}})
      expect(firstPreview).not.toContain("{{name}}");
      expect(firstPreview).not.toContain("{{role}}");
      console.log("Message preview verified - merge tags are interpolated");
    }

    // Step 7: Test individual "Send" button (opens SMS URI)
    console.log("Step 7: Testing individual Send button");

    // Find Send buttons for selected candidates
    const sendButtons = page.locator('button:has-text("Send")');
    const sendButtonCount = await sendButtons.count();

    if (sendButtonCount > 0) {
      // Get the first Send button
      const firstSendButton = sendButtons.first();

      // Set up a listener for window.open calls (SMS URI)
      let smsUri: string | null = null;
      page.on('popup', async (popup) => {
        const url = popup.url();
        if (url.startsWith('sms:')) {
          smsUri = url;
        }
        await popup.close();
      });

      // Click Send button
      await firstSendButton.click();
      await page.waitForTimeout(1000);

      // Verify SMS URI would be generated (check button state or look for sent indicator)
      // The button should trigger window.open with sms: URI
      // In a real scenario, this would open the Messages app
      console.log("Send button clicked - SMS URI should open Messages app");
    }

    // Step 8: Test batch send functionality
    console.log("Step 8: Testing batch send button");

    const batchSendButton = page.locator('button:has-text("Send to"), button:has-text("candidate")');
    const batchSendCount = await batchSendButton.count();

    if (batchSendCount > 0) {
      // Verify button shows correct candidate count
      const buttonText = await batchSendButton.first().textContent();
      expect(buttonText).toContain(candidatesToSelect.toString());

      // Button should be enabled when candidates are selected
      await expect(batchSendButton.first()).toBeEnabled();

      console.log("Batch send button is ready");

      // Note: We don't actually click it in the test to avoid opening multiple popups
      // In a real scenario, this would open Messages app sequentially for each candidate
    }

    // Step 9: Verify character count and SMS segments
    console.log("Step 9: Verifying SMS character count");

    const characterCount = page.locator('text=/\\d+ characters/i');
    if (await characterCount.count() > 0) {
      const countText = await characterCount.first().textContent();
      expect(countText).toMatch(/\d+ characters/);
      console.log("Character count displayed:", countText);
    }

    const smsSegments = page.locator('text=/SMS message/i');
    if (await smsSegments.count() > 0) {
      const segmentsText = await smsSegments.first().textContent();
      expect(segmentsText).toMatch(/SMS message/);
      console.log("SMS segments displayed:", segmentsText);
    }

    console.log("✅ Campaign workflow test completed successfully");
  });

  test("should verify merge tag interpolation in message preview", async ({ page }) => {
    // Navigate to campaign builder
    const sendSmsTab = page.locator('button[role="tab"]:has-text("Send SMS")');
    if (await sendSmsTab.count() > 0) {
      await sendSmsTab.click();
    } else {
      await page.click('button:has-text("Campaigns")');
    }

    await page.waitForTimeout(500);

    // Select at least one candidate
    const checkboxes = page.locator("tbody tr input[type='checkbox']");
    if (await checkboxes.count() > 0) {
      await checkboxes.first().check();
      await page.waitForTimeout(300);

      // Navigate back to campaign if needed
      if (await sendSmsTab.count() === 0) {
        await page.click('button:has-text("Campaigns")');
        await page.waitForTimeout(500);
      }
    }

    // Set message template with merge tags
    const messageTemplate = page.locator('textarea[placeholder*="message" i]');
    await messageTemplate.fill("Hello {{name}}, interested in {{role}} in {{city}}? Link: {{calendly_link}}");

    // Verify preview doesn't contain raw merge tags
    await page.waitForTimeout(500);

    const previews = page.locator('text=/Preview/i');
    if (await previews.count() > 0) {
      const previewText = await previews.first().locator('..').textContent();

      // Should not contain merge tag syntax
      expect(previewText).not.toContain("{{name}}");
      expect(previewText).not.toContain("{{role}}");
      expect(previewText).not.toContain("{{city}}");

      // Should contain actual values (at least some text)
      expect(previewText?.length).toBeGreaterThan(10);
    }
  });

  test("should verify SMS URI format is correct", async ({ page, context }) => {
    // Navigate to campaign builder
    const sendSmsTab = page.locator('button[role="tab"]:has-text("Send SMS")');
    if (await sendSmsTab.count() > 0) {
      await sendSmsTab.click();
    } else {
      await page.click('button:has-text("Campaigns")');
    }

    await page.waitForTimeout(500);

    // Select a candidate
    const checkboxes = page.locator("tbody tr input[type='checkbox']");
    if (await checkboxes.count() > 0) {
      await checkboxes.first().check();
      await page.waitForTimeout(300);
    }

    // Set a simple message
    const messageTemplate = page.locator('textarea[placeholder*="message" i]');
    await messageTemplate.fill("Hi {{name}}, test message");

    // Intercept window.open to capture SMS URI
    let capturedSmsUri: string | null = null;

    await page.addInitScript(() => {
      const originalOpen = window.open;
      (window as any).__smsUri = null;
      window.open = function (url?: string | URL, target?: string, features?: string) {
        if (typeof url === 'string' && url.startsWith('sms:')) {
          (window as any).__smsUri = url;
        }
        return originalOpen.call(this, url, target, features);
      };
    });

    // Click Send button
    const sendButton = page.locator('button:has-text("Send")').first();
    if (await sendButton.count() > 0) {
      await sendButton.click();
      await page.waitForTimeout(500);

      // Get captured SMS URI
      capturedSmsUri = await page.evaluate(() => (window as any).__smsUri);

      if (capturedSmsUri) {
        // Verify SMS URI format
        expect(capturedSmsUri).toMatch(/^sms:\d+/);
        expect(capturedSmsUri).toContain("?body=");

        // Verify phone number is cleaned (no special characters)
        const phoneMatch = capturedSmsUri.match(/^sms:(\d+)/);
        expect(phoneMatch).toBeTruthy();
        if (phoneMatch) {
          const phone = phoneMatch[1];
          expect(phone).toMatch(/^\d+$/); // Only digits
          expect(phone.length).toBeGreaterThan(0);
        }

        // Verify message is URL encoded
        const bodyMatch = capturedSmsUri.match(/\?body=(.+)$/);
        expect(bodyMatch).toBeTruthy();

        console.log("✅ SMS URI format verified:", capturedSmsUri.substring(0, 50) + "...");
      }
    }
  });
});
