import { test, expect } from "@playwright/test";
import {
  loginWithCredentials,
  logout,
  isLoggedIn,
} from "./helpers/auth";

const TEST_USER = "rjames@orion.edu";
const TEST_PASSWORD = "Password123!";

test.describe("Navigation and session persistence", () => {
  test.describe("Post-login and initial load", () => {
    test("post-login redirect lands on workspaces or change-password", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USER);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(
        (url) =>
          url.pathname === "/workspaces" || url.pathname === "/change-password",
        { timeout: 15000 }
      );
      await expect(page).not.toHaveURL(/\/login/);
    });

    test("unauthenticated visit to / redirects to login", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/login/);
    });

    test("authenticated visit to / redirects to workspaces", async ({
      page,
    }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await page.goto("/");
      await expect(page).toHaveURL(/\/workspaces/);
    });

    test("unauthenticated visit to /workspaces redirects to login", async ({
      page,
    }) => {
      await page.goto("/workspaces");
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Session persists across navigation", () => {
    test("Workspaces → Admin → Workspaces keeps session", async ({
      page,
    }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await expect(page).toHaveURL(/\/workspaces/);

      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.getByText("Platform Administration")).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("link", { name: /back to workspace/i }).click();
      await expect(page).toHaveURL(/\/workspaces/);
      await expect(page.getByText(/Welcome back/i)).toBeVisible({
        timeout: 10000,
      });
      expect(await isLoggedIn(page)).toBe(true);
    });

    test("Workspaces → Docs → Workspaces keeps session", async ({
      page,
    }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await expect(page).toHaveURL(/\/workspaces/);

      await page.goto("/docs");
      await expect(page).toHaveURL(/\/docs/);

      await page.getByRole("button", { name: /back to workspace/i }).click();
      await expect(page).toHaveURL(/\/workspaces/);
      await expect(page.getByText(/Welcome back/i)).toBeVisible({
        timeout: 10000,
      });
      expect(await isLoggedIn(page)).toBe(true);
    });

    test("client-side navigation chain keeps session", async ({ page }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await expect(page).toHaveURL(/\/workspaces/);

      await page.goto("/recruiter");
      await expect(page).toHaveURL(/\/recruiter/);

      await page.goto("/workspaces");
      await expect(page).toHaveURL(/\/workspaces/);
      expect(await isLoggedIn(page)).toBe(true);
    });

    test("multiple protected routes in sequence keep session", async ({
      page,
    }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await expect(page).toHaveURL(/\/workspaces/);

      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin/);

      await page.goto("/recruiter");
      await expect(page).toHaveURL(/\/recruiter/);

      await page.goto("/workspaces");
      await expect(page).toHaveURL(/\/workspaces/);
      expect(await isLoggedIn(page)).toBe(true);
    });
  });

  test.describe("Session persists across full page reload", () => {
    test("reload on workspaces keeps session", async ({ page }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await expect(page).toHaveURL(/\/workspaces/);

      await page.reload();
      await expect(page).toHaveURL(/\/workspaces/);
      await expect(page.getByText(/Welcome back/i)).toBeVisible({
        timeout: 10000,
      });
      expect(await isLoggedIn(page)).toBe(true);
    });

    test("reload on admin keeps session", async ({ page }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin/);

      await page.reload();
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.getByText("Platform Administration")).toBeVisible({
        timeout: 10000,
      });
      expect(await isLoggedIn(page)).toBe(true);
    });

    test("reload on recruiter keeps session", async ({ page }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await page.goto("/recruiter");
      await expect(page).toHaveURL(/\/recruiter/);

      await page.reload();
      await expect(page).toHaveURL(/\/recruiter/);
      expect(await isLoggedIn(page)).toBe(true);
    });
  });

  test.describe("Back to Workspace", () => {
    test("from Admin: Back to Workspace lands on workspaces with session", async ({
      page,
    }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin/);

      await page.getByRole("link", { name: /back to workspace/i }).click();
      await expect(page).toHaveURL(/\/workspaces/);
      await expect(
        page.locator("[data-testid='session-indicator']")
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/Welcome back/i)).toBeVisible();
    });

    test("from Docs: Back to Workspace lands on workspaces with session", async ({
      page,
    }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await page.goto("/docs");
      await expect(page).toHaveURL(/\/docs/);

      await page.getByRole("button", { name: /back to workspace/i }).click();
      await expect(page).toHaveURL(/\/workspaces/);
      await expect(
        page.locator("[data-testid='session-indicator']")
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/Welcome back/i)).toBeVisible();
    });
  });

  test.describe("Session drop after logout", () => {
    test("after logout, protected routes redirect to login", async ({
      page,
    }) => {
      await loginWithCredentials(page, TEST_USER, TEST_PASSWORD);
      await expect(page).toHaveURL(/\/workspaces/);

      await logout(page);
      await expect(page).toHaveURL(/\/login/);

      await page.goto("/workspaces");
      await expect(page).toHaveURL(/\/login/);

      await page.goto("/admin");
      await expect(page).toHaveURL(/\/login/);

      await page.goto("/recruiter");
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
