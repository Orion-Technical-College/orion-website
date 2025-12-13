import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Settings Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    await page.goto("/settings");
  });

  test("should display user profile information", async ({ page }) => {
    // Should show user name
    await expect(page.locator('input[name="name"]')).toBeVisible();
    
    // Should show user email
    await expect(page.locator('input[name="email"]')).toBeVisible();
    
    // Should show user email is read-only (if implemented)
    const emailInput = page.locator('input[name="email"]');
    const isReadOnly = await emailInput.getAttribute("readonly");
    expect(isReadOnly).toBeTruthy();
  });

  test("should update profile information", async ({ page }) => {
    const nameInput = page.locator('input[name="name"]');
    const originalName = await nameInput.inputValue();
    
    // Update name
    await nameInput.clear();
    await nameInput.fill("Updated Name");
    
    // Save changes
    await page.click('button:has-text("Save")');
    
    // Should show success message
    await expect(page.locator("text=/saved|updated|success/i")).toBeVisible({ timeout: 5000 });
    
    // Verify name was updated
    await page.reload();
    const updatedName = await nameInput.inputValue();
    expect(updatedName).toBe("Updated Name");
  });

  test("should change password successfully", async ({ page }) => {
    // Navigate to password change section
    await page.click('button:has-text("Change Password")');
    
    // Fill in password change form
    await page.fill('input[name="currentPassword"]', "Password123!");
    await page.fill('input[name="newPassword"]', "NewPassword123!");
    await page.fill('input[name="confirmPassword"]', "NewPassword123!");
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator("text=/password.*changed|success/i")).toBeVisible({ timeout: 5000 });
    
    // Should be able to login with new password
    await page.goto("/login");
    await loginWithCredentials(page, "rjames@orion.edu", "NewPassword123!");
    await expect(page).toHaveURL("/");
  });

  test("should validate password complexity", async ({ page }) => {
    // Navigate to password change section
    await page.click('button:has-text("Change Password")');
    
    // Try to set a weak password
    await page.fill('input[name="currentPassword"]', "Password123!");
    await page.fill('input[name="newPassword"]', "weak");
    await page.fill('input[name="confirmPassword"]', "weak");
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator("text=/password.*must|complexity|requirements/i")).toBeVisible({ timeout: 5000 });
  });

  test("should require current password to change password", async ({ page }) => {
    // Navigate to password change section
    await page.click('button:has-text("Change Password")');
    
    // Try to change password without current password
    await page.fill('input[name="newPassword"]', "NewPassword123!");
    await page.fill('input[name="confirmPassword"]', "NewPassword123!");
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator("text=/current.*password|required/i")).toBeVisible({ timeout: 5000 });
  });

  test("should update API keys", async ({ page }) => {
    // Navigate to API keys section
    await page.click('button:has-text("API Keys")');
    
    // Update Google Messages API key
    const googleKeyInput = page.locator('input[name="googleMessages"]');
    await googleKeyInput.clear();
    await googleKeyInput.fill("new-google-key-12345");
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Should show success message
    await expect(page.locator("text=/saved|updated|success/i")).toBeVisible({ timeout: 5000 });
    
    // Verify key was saved (should be masked in display)
    await page.reload();
    const displayedKey = await googleKeyInput.inputValue();
    // Key should be masked (showing only last 4 characters or similar)
    expect(displayedKey).toMatch(/^\*{4,}.*$/);
  });

  test("should mask API keys in display", async ({ page }) => {
    // Navigate to API keys section
    await page.click('button:has-text("API Keys")');
    
    // Check that existing keys are masked
    const googleKeyInput = page.locator('input[name="googleMessages"]');
    const displayedKey = await googleKeyInput.inputValue();
    
    // Should be masked (not showing full key)
    if (displayedKey) {
      expect(displayedKey.length).toBeGreaterThan(4);
      expect(displayedKey).toMatch(/^\*{4,}.*$/);
    }
  });
});

