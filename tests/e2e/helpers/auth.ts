import { Page } from "@playwright/test";

/**
 * Playwright auth helpers for E2E tests.
 * Two modes:
 * 1. Real login: Fill in login form (useful for smoke and happy path)
 * 2. Programmatic login: Call test-only endpoint or seed session cookie directly (useful for role-specific flows, faster)
 */

/**
 * Real login: Fill in the login form and submit.
 * Useful for smoke tests and happy path scenarios.
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"));
}

/**
 * Programmatic login: Set session cookie directly.
 * Faster than real login, useful for role-specific flows.
 * Note: This requires a test-only endpoint or direct cookie manipulation.
 */
export async function loginProgrammatically(
  page: Page,
  userId: string,
  role: string,
  clientId?: string | null
): Promise<void> {
  // This would require a test-only endpoint to create a session
  // For now, we'll use real login as fallback
  // TODO: Implement test-only session creation endpoint
  throw new Error("Programmatic login not yet implemented. Use loginWithCredentials instead.");
}

/**
 * Logout helper.
 */
export async function logout(page: Page): Promise<void> {
  // Find and click logout button
  // This depends on your UI implementation
  await page.click('button:has-text("Logout")');
  await page.waitForURL((url) => url.pathname.includes("/login"));
}

/**
 * Check if user is logged in by checking for session indicator.
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for user name or profile indicator
  const userIndicator = await page.locator('[data-testid="user-name"]').count();
  return userIndicator > 0;
}

/**
 * Wait for authentication to complete.
 */
export async function waitForAuth(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="user-name"]', { timeout: 5000 }).catch(() => {
    // If user name selector doesn't exist, check for redirect to login
    const url = page.url();
    if (url.includes("/login")) {
      throw new Error("User was redirected to login page");
    }
  });
}

