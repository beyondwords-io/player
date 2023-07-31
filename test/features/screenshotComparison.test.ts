import { test, expect } from "@playwright/test";
import playerPermutations from "../support/playerPermutations.ts";

test("screenshot comparison", async ({ page }) => {
  await page.goto("http://localhost:8000");

  await waitForStylesToLoad(page);
  await resetPlayerProps(page);

  await playerPermutations(async (params) => {
    await page.evaluate(async (params) => {
      const player = BeyondWords.Player.instances()[0];
      Object.entries(params).forEach(([k, v]) => player[k] = v);

      window.scrollTo(0, params.widgetPosition ? 99999 : 0);
      await new Promise(resolve => setTimeout(resolve, 100));
    }, params);

    const selector = params.widgetPosition ? ".fixed" : ":not(.fixed)";
    const userInterface = page.locator(`.user-interface${selector}`);

    const name = `${screenshotName(params)}.png`;
    await expect(userInterface).toHaveScreenshot(name, { fullPage: true, maxDiffPixelRatio: 0.01 });

    process.stdout.write(".");
  });
});

const waitForStylesToLoad = async (page) => {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      setInterval(() => BeyondWords.Player._styleLoaded && resolve(), 100);
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

const screenshotName = (params) => (
  [
    params.playerStyle,
    params.playbackState,
    params.advertIndex === 0 && "advert",
    params.advertIndex === 0 && !params.adverts[0].imageUrl && "no-image",
    params.content.length > 1 && "playlist",
    params.widgetPosition && `widget-${params.widgetPosition}-${params.widgetWidth}`.replace("%", ""),
  ].filter(s => s).join("-")
);
