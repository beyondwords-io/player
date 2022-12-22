import { test, expect } from "@playwright/test";

test("example", async ({ page }) => {
  await page.goto("http://localhost:8000");

  const bounds = await page.evaluate(async () => {
    player = BeyondWords.Player.instances()[0];
    player.interfaceStyle = "icon";
    return player.target.getBoundingClientRect();
  });

  await expect(page).toHaveScreenshot({ clip: bounds });
});
