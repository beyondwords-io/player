import { test, expect } from "@playwright/test";
import playerPermutations from "../support/playerPermutations.ts";
import AxeBuilder from "@axe-core/playwright";

test("accessibility standards", async ({ page }) => {
  await page.goto("http://localhost:8000");
  await new Promise(resolve => setTimeout(resolve, 1000));

  await playerPermutations(async (params) => {
    await page.evaluate(async (params) => {
      const player = BeyondWords.Player.instances()[0];
      Object.entries(params).forEach(([k, v]) => player[k] = v);

      window.scrollTo(0, params.widgetPosition ? 99999 : 0);
      await new Promise(resolve => setTimeout(resolve, 100));
    }, params);

    const results = await new AxeBuilder({ page })
      .include(".beyondwords-player")
      .exclude(".animating")
      .analyze();

    expect(results.violations).toEqual([]);
    process.stdout.write(".");
  });
});
