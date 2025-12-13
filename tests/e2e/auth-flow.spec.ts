import { test, expect } from "@playwright/test";
import { loginWithCredentials, logout, isLoggedIn } from "./helpers/auth";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start from a clean state
    await page.goto("/");
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/");
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/);
  });

  test("should login with valid credentials", async ({ page }) => {
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    
    // Should redirect to home page after login
    await expect(page).toHaveURL("/");
    
    // Should show user is logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator("text=/invalid|incorrect|error/i")).toBeVisible({ timeout: 5000 });
    
    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should prompt for password change if mustChangePassword is true", async ({ page }) => {
    // This test assumes the seed admin has mustChangePassword: true
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    
    // Should redirect to change password page
    await expect(page).toHaveURL(/\/change-password/);
  });

  test("should allow password change", async ({ page }) => {
    // First login (assuming mustChangePassword is true)
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    
    // Should be on change password page
    await expect(page).toHaveURL(/\/change-password/);
    
    // Fill in new password
    await page.fill('input[name="currentPassword"]', "Password123!");
    await page.fill('input[name="newPassword"]', "NewPassword123!");
    await page.fill('input[name="confirmPassword"]', "NewPassword123!");
    await page.click('button[type="submit"]');
    
    // Should redirect to home after successful password change
    await expect(page).toHaveURL("/");
  });

  test("should logout successfully", async ({ page }) => {
    await loginWithCredentials(page, "rjames@orion.edu", "Password123!");
    
    // Wait for login to complete
    await expect(page).toHaveURL("/");
    
    // Logout
    await logout(page);
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Should not be logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(false);
  });

  test("should prevent access to protected routes when not authenticated", async ({ page }) => {
    // Try to access admin page without authentication
    await page.goto("/admin");
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("should enforce rate limiting on login attempts", async ({ page }) => {
    await page.goto("/login");
    
    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"]', "invalid@example.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500); // Wait between attempts
    }
    
    // Should show rate limit error
    await expect(page.locator("text=/too many|rate limit/i")).toBeVisible({ timeout: 5000 });
  });
});

