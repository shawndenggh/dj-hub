import { test, expect } from "@playwright/test";

test.describe("Admin Panel", () => {
  test("admin panel is protected", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/login|signin/);
  });

  test("admin analytics is protected", async ({ page }) => {
    await page.goto("/admin/analytics");
    await expect(page).toHaveURL(/login|signin/);
  });

  test("admin users page is protected", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/login|signin/);
  });
});
