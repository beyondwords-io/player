import { test, expect } from "@playwright/test";
import defaultPlayerPermutations, { defaultScreenshotName } from "../support/defaultPlayerPermutations.ts";

test("default player screenshot comparison", async ({ page }) => {
  await page.goto("http://localhost:8000");

  await waitForStylesToLoad(page);
  await resetPlayerProps(page);

  await defaultPlayerPermutations(async (params) => {
    await expect(async () => {
      await page.evaluate(async (params) => {
        const player = BeyondWords.Player.instances()[0];
        Object.entries(params).forEach(([k, v]) => player[k] = v);

        window.scrollTo(0, params.widgetPosition ? 99999 : 0);
        await new Promise(resolve => setTimeout(resolve, 50));
      }, params);

      const selector = params.widgetPosition ? ".default-player.fixed" : ".default-player:not(.fixed)";
      const defaultPlayer = page.locator(selector);

      const name = `${defaultScreenshotName(params)}.png`;
      await expect(defaultPlayer).toHaveScreenshot(name, { fullPage: true, maxDiffPixelRatio: 0.01 });
    }).toPass({
      intervals: [0, 500, 1000, 1500, 2000],
      timeout: 10000,
    });

    process.stdout.write(".");
  });
});

const waitForStylesToLoad = async (page) => {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      setInterval(() => BeyondWords.Player._styleLoaded && resolve(), 100);
      window.disableAnimation = true;
      window.disableMediaLoad = true;
    });
  });
};

const resetPlayerProps = async (page) => {
  await page.evaluate(async () => {
    BeyondWords.Player.destroyAll();
    new BeyondWords.Player({ target: ".beyondwords-player" });
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
};
