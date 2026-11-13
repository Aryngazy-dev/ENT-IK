import { test, expect } from "@playwright/test";

test("public landing has a route to training", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /начать тренировку/i })).toBeVisible();
});

test("login form remains usable on a mobile viewport", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Пароль")).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});
