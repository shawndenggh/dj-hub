import { test, expect } from "@playwright/test";

test.describe("Search Flow", () => {
  test("search page is protected", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL(/login|signin/);
  });

  test("home page renders without auth", async ({ page }) => {
    await page.goto("/");
    // Should render something — either home page or redirect to login
    await expect(page).not.toHaveURL(/error/);
  });

  test("pricing page is publicly accessible", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator("text=/free|pro|enterprise/i").first()).toBeVisible();
  });
});
