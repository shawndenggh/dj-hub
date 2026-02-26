import { test, expect } from "@playwright/test";

test.describe("Recommendations Flow", () => {
  test("recommendations page is protected", async ({ page }) => {
    await page.goto("/recommendations");
    await expect(page).toHaveURL(/login|signin/);
  });

  test("API returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/recommendations");
    expect(res.status()).toBe(401);
  });

  test("recommendations API returns proper JSON structure", async ({ request }) => {
    const res = await request.get("/api/recommendations");
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });
});
