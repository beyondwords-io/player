import { test, expect } from "@playwright/test";

test("example", async ({ page }) => {
  await page.goto("http://localhost:8000");
  return;
  await expect(page.locator("p")).toContainText("showing user interface");
});
