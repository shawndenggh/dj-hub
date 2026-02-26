import { test, expect } from "@playwright/test";

test.describe("Channels Flow", () => {
  test("channels page is protected", async ({ page }) => {
    await page.goto("/channels");
    await expect(page).toHaveURL(/login|signin/);
  });

  test("channels API returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/channels");
    expect(res.status()).toBe(401);
  });

  test("create channel API returns 401 without auth", async ({ request }) => {
    const res = await request.post("/api/channels", {
      data: { name: "Test Channel", isPublic: false },
    });
    expect(res.status()).toBe(401);
  });
});
