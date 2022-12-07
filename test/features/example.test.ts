import { test, expect } from "@playwright/test";

test("example", async ({ page }) => {
  await page.goto("http://localhost:8000");
  await expect(page.locator("p")).toContainText("Hello, World!");
});
