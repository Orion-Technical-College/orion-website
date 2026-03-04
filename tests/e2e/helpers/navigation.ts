import { Page } from "@playwright/test";

/**
 * E2E helpers for navigation flows.
 * Use these for consistent "go to workspace", "Back to Workspace", etc.
 */

export async function goToWorkspaces(page: Page): Promise<void> {
  await page.goto("/workspaces");
}

export async function goToAdmin(page: Page): Promise<void> {
  await page.goto("/admin");
}

export async function goToDocs(page: Page): Promise<void> {
  await page.goto("/docs");
}

export async function goToRecruiter(page: Page): Promise<void> {
  await page.goto("/recruiter");
}

/**
 * Clicks the "Back to Workspace" link/button (admin uses link, docs uses button).
 */
export async function clickBackToWorkspace(page: Page): Promise<void> {
  const link = page.getByRole("link", { name: /back to workspace/i });
  const button = page.getByRole("button", { name: /back to workspace/i });
  if ((await link.count()) > 0) {
    await link.first().click();
  } else {
    await button.first().click();
  }
}
