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
 * After login, user lands on /workspaces or /change-password (when required).
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
  await page.waitForURL(
    (url) =>
      url.pathname === "/workspaces" ||
      url.pathname === "/change-password",
    { timeout: 15000 }
  );
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
 * Clicks Sign Out (workspaces header icon with title, or sidebar/layout "Sign Out" text).
 */
export async function logout(page: Page): Promise<void> {
  const signOutButton = page
    .locator('button[title="Sign out"]')
    .or(page.locator('button:has-text("Sign Out")'));
  await signOutButton.first().click();
  await page.waitForURL((url) => url.pathname.includes("/login"), {
    timeout: 10000,
  });
}

/**
 * Check if user is logged in by checking for session indicator.
 * Prefers data-testid="session-indicator" when present; otherwise uses
 * "not on login page" plus presence of "Welcome back" or Sign Out control.
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  if (url.includes("/login")) return false;
  const byTestId = await page.locator('[data-testid="session-indicator"]').count();
  if (byTestId > 0) return true;
  const welcomeBack = await page.locator('text=/Welcome back/i').count();
  if (welcomeBack > 0) return true;
  const signOut =
    (await page.locator('button[title="Sign out"]').count()) +
    (await page.locator('button:has-text("Sign Out")').count());
  return signOut > 0;
}

/**
 * Wait for authentication to complete (session visible after redirect to workspaces/change-password).
 */
export async function waitForAuth(page: Page): Promise<void> {
  const timeout = 10000;
  try {
    await Promise.race([
      page.waitForSelector('[data-testid="session-indicator"]', { timeout }),
      page.waitForSelector('text=/Welcome back/i', { timeout }),
      page.waitForSelector('button[title="Sign out"], button:has-text("Sign Out")', { timeout }),
    ]);
  } catch {
    if (page.url().includes("/login")) {
      throw new Error("User was redirected to login page");
    }
  }
}

