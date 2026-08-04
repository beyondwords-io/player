import { test, expect } from "@playwright/test";
import defaultPlayerPermutations from "../support/defaultPlayerPermutations.ts";
import AxeBuilder from "@axe-core/playwright";

test("default player accessibility standards", async ({ page }) => {
  await page.goto("http://localhost:8000");

  await waitForStylesToLoad(page);
  await resetPlayerProps(page);

  await defaultPlayerPermutations(async (params) => {
    await page.evaluate(async (params) => {
      const player = BeyondWords.Player.instances()[0];
      Object.entries(params).forEach(([k, v]) => player[k] = v);

      window.scrollTo(0, params.widgetPosition ? 99999 : 0);
      await new Promise(resolve => setTimeout(resolve, 50));
    }, params);

    const results = await new AxeBuilder({ page })
      .include(".beyondwords-player")
      .exclude(".animating")
      .analyze();

    expect(results.violations).toEqual([]);
    process.stdout.write(".");
  });

  // The normal permutations leave the queue collapsed. Open it explicitly so
  // axe also checks the list semantics of the interactive playlist rows.
  await page.evaluate(() => {
    const player = BeyondWords.Player.instances()[0];
    const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 30 }];

    Object.assign(player, {
      playerStyle: "default",
      widgetStyle: "none",
      playlistStyle: "show",
      content: [
        { title: "First item", audio },
        { title: "Second item", audio },
      ],
    });
  });

  const queueResults = await new AxeBuilder({ page })
    .include(".default-player .queue")
    .analyze();

  expect(queueResults.violations).toEqual([]);
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
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
};
