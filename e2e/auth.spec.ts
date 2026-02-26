import { test, expect, Page } from "@playwright/test";

const TEST_USER = {
  name: "E2E Test User",
  email: `e2e-auth-${Date.now()}@test.com`,
  password: "TestPass1!",
};

async function fillRegisterForm(page: Page, user = TEST_USER) {
  await page.fill('[name="name"]', user.name);
  await page.fill('[name="email"]', user.email);
  await page.fill('[name="password"]', user.password);
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
}

test.describe("Authentication Flow", () => {
  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveTitle(/DJ Hub|Register/i);
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible();
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/DJ Hub|Login/i);
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i })).toBeVisible();
  });

  test("forgot password page renders correctly", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot|reset/i })).toBeVisible();
  });

  test("register form shows validation errors for invalid input", async ({ page }) => {
    await page.goto("/register");
    await page.click('[type="submit"]');
    await expect(page.locator("text=/required|at least|invalid/i").first()).toBeVisible();
  });

  test("login form shows error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, "wrong@example.com", "WrongPass1");
    await page.click('[type="submit"]');
    await expect(page.locator("text=/invalid|error|failed/i").first()).toBeVisible({ timeout: 8000 });
  });

  test("redirect to login when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login|signin/);
  });

  test("forgot password form submits successfully", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('[name="email"]', "test@example.com");
    await page.click('[type="submit"]');
    await expect(page.locator("text=/sent|check|email/i").first()).toBeVisible({ timeout: 8000 });
  });
});
