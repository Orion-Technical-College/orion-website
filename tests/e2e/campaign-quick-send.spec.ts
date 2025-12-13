import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Campaign and Quick Send Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    await page.goto("/");
    await page.waitForSelector("table", { timeout: 10000 });
  });

  test("should create a new campaign", async ({ page }) => {
    // Navigate to campaigns tab
    await page.click('button:has-text("Campaigns")');
    
    // Click create campaign button
    const createButton = page.locator('button:has-text("Create Campaign")');
    if (await createButton.count() > 0) {
      await createButton.click();
      
      // Fill in campaign details
      await page.fill('input[name="name"]', "Test Campaign");
      await page.fill('textarea[name="message"]', "Hello {{name}}, this is a test message for {{jobTitle}}.");
      
      // Add optional Calendly link
      await page.fill('input[name="calendlyLink"]', "https://calendly.com/test");
      
      // Add optional Zoom link
      await page.fill('input[name="zoomLink"]', "https://zoom.us/j/12345");
      
      // Save campaign
      await page.click('button:has-text("Save")');
      
      // Should show success message
      await expect(page.locator("text=/created|saved|success/i")).toBeVisible({ timeout: 5000 });
      
      // Verify campaign appears in list
      await expect(page.locator("text=/Test Campaign/i")).toBeVisible();
    }
  });

  test("should select candidates for campaign", async ({ page }) => {
    // Navigate to campaigns tab
    await page.click('button:has-text("Campaigns")');
    
    // Select an existing campaign or create one
    const campaignCard = page.locator('[data-testid="campaign-card"]').first();
    if (await campaignCard.count() > 0) {
      await campaignCard.click();
      
      // Click "Select Candidates" button
      await page.click('button:has-text("Select Candidates")');
      
      // Select candidates from workspace
      const checkboxes = page.locator("tbody tr input[type='checkbox']");
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        // Select first 2 candidates
        for (let i = 0; i < Math.min(2, checkboxCount); i++) {
          await checkboxes.nth(i).check();
        }
        
        // Confirm selection
        await page.click('button:has-text("Add to Campaign")');
        
        // Verify candidates were added
        await expect(page.locator("text=/2.*candidates|selected/i")).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("should generate personalized SMS messages with merge tags", async ({ page }) => {
    // Navigate to campaigns tab
    await page.click('button:has-text("Campaigns")');
    
    // Create campaign with merge tags
    const createButton = page.locator('button:has-text("Create Campaign")');
    if (await createButton.count() > 0) {
      await createButton.click();
      
      await page.fill('input[name="name"]', "Personalized Campaign");
      await page.fill('textarea[name="message"]', "Hi {{name}}, we're interested in your {{jobTitle}} application. Schedule: {{calendly_link}}");
      
      await page.click('button:has-text("Save")');
      
      // Select campaign
      await page.locator("text=/Personalized Campaign/i").click();
      
      // Select a candidate
      await page.click('button:has-text("Select Candidates")');
      const firstCheckbox = page.locator("tbody tr input[type='checkbox']").first();
      if (await firstCheckbox.count() > 0) {
        await firstCheckbox.check();
        await page.click('button:has-text("Add to Campaign")');
      }
      
      // Generate message preview
      const previewButton = page.locator('button:has-text("Preview")');
      if (await previewButton.count() > 0) {
        await previewButton.click();
        
        // Verify merge tags are replaced
        const previewText = await page.locator('[data-testid="message-preview"]').textContent();
        expect(previewText).not.toContain("{{name}}");
        expect(previewText).not.toContain("{{jobTitle}}");
      }
    }
  });

  test("should generate correct SMS URI format", async ({ page }) => {
    // Navigate to campaigns tab
    await page.click('button:has-text("Campaigns")');
    
    // Select a campaign
    const campaignCard = page.locator('[data-testid="campaign-card"]').first();
    if (await campaignCard.count() > 0) {
      await campaignCard.click();
      
      // Click "Send" on first candidate
      const sendButton = page.locator('button:has-text("Send")').first();
      if (await sendButton.count() > 0) {
        // Get the SMS link (would open Messages app in real scenario)
        const smsLink = page.locator('a[href^="sms:"]').first();
        if (await smsLink.count() > 0) {
          const href = await smsLink.getAttribute("href");
          
          // Verify SMS URI format
          expect(href).toMatch(/^sms:\d+/);
          expect(href).toContain("?body=");
          
          // Verify message is URL encoded
          const bodyParam = new URL("http://example.com" + href.replace("sms:", "?")).searchParams.get("body");
          expect(bodyParam).toBeTruthy();
          expect(bodyParam).not.toContain("{{");
        }
      }
    }
  });

  test("should handle Quick Send workflow", async ({ page }) => {
    // Select candidates in workspace
    const checkboxes = page.locator("tbody tr input[type='checkbox']");
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      // Select first candidate
      await checkboxes.first().check();
      
      // Navigate to campaigns
      await page.click('button:has-text("Campaigns")');
      
      // Create quick campaign
      await page.click('button:has-text("Quick Send")');
      
      // Fill in message
      await page.fill('textarea[name="message"]', "Hi {{name}}, quick message!");
      
      // Click send on first candidate
      const sendButton = page.locator('button:has-text("Send")').first();
      if (await sendButton.count() > 0) {
        // Verify SMS link is generated
        const smsLink = page.locator('a[href^="sms:"]').first();
        if (await smsLink.count() > 0) {
          const href = await smsLink.getAttribute("href");
          expect(href).toMatch(/^sms:\d+/);
        }
      }
    }
  });
});

