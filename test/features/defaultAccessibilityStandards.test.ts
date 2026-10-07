import { test, expect } from "@playwright/test";
import defaultPlayerPermutations, { defaultScreenshotName } from "../support/defaultPlayerPermutations.ts";
import AxeBuilder from "@axe-core/playwright";

test("default player accessibility standards", async ({ page }) => {
  await page.goto("http://localhost:8000");

  await waitForStylesToLoad(page);
  await resetPlayerProps(page);

  await defaultPlayerPermutations(async (params) => {
    await page.evaluate(async (params) => {
      // Captions inherit the host page background; their literal dark preset
      // is intended for a dark page. Light pages can set secondaryTextColor.
      document.body.style.backgroundColor = params.theme === "dark" ? "#212121" : "#ffffff";
      const player = BeyondWords.Player.instances()[0];
      Object.entries(params).forEach(([k, v]) => player[k] = v);

      window.scrollTo(0, params.widgetPosition ? 99999 : 0);
      await new Promise(resolve => setTimeout(resolve, 50));
    }, params);

    const results = await new AxeBuilder({ page })
      .include(".beyondwords-player")
      .exclude(".animating")
      .analyze();

    // Report every failing state rather than hiding later failures behind the
    // first one. Soft assertions still fail the test when any violation exists.
    expect.soft(results.violations, defaultScreenshotName(params)).toEqual([]);
    process.stdout.write(".");
  });
});

for (const theme of ["light", "dark"]) {
  test(`default player ${theme} queue accessibility`, async ({ page }) => {
    await showQueue(page, theme);

    const checkQueue = async (state) => {
      const results = await new AxeBuilder({ page })
        .include(".default-player .queue")
        .analyze();

      expect.soft(results.violations, `${theme}: ${state}`).toEqual([]);
      expect.soft(results.incomplete.filter(result => result.id === "color-contrast"), `${theme}: contrast is measurable`).toEqual([]);
    };

    // Audit the real backgrounds, including the selected row's overlay.
    await checkQueue("selected and idle rows");

    if (await hasHover(page)) {
      await page.locator(".queue .row").nth(1).hover();
      await checkQueue("hovered idle row");
      await page.mouse.move(0, 0);
    }

    await page.evaluate(() => BeyondWords.Player.instances()[0].contentIndex = 1);
    await checkQueue("selection moves to the second row");
  });
}

test("default player queue literal palette behaviour", async ({ page }) => {
  await showQueue(page, "light");
  await page.evaluate(() => {
    // Deliberately low contrast: publisher colors must stay literal even when
    // a queue state selects a different text role from the palette.
    BeyondWords.Player.instances()[0].lightTheme = {
      textColor: "#eeeeee",
      secondaryTextColor: "#dddddd",
    };
  });

  const durations = page.locator(".queue .duration");
  await expect(durations.nth(0)).toHaveCSS("color", "rgb(238, 238, 238)");
  await expect(durations.nth(1)).toHaveCSS("color", "rgb(221, 221, 221)");

  if (await hasHover(page)) {
    await page.locator(".queue .row").nth(1).hover();
    await expect(durations.nth(1)).toHaveCSS("color", "rgb(238, 238, 238)");
    await page.mouse.move(0, 0);
    await expect(durations.nth(1)).toHaveCSS("color", "rgb(221, 221, 221)");
  }

  await page.evaluate(() => BeyondWords.Player.instances()[0].contentIndex = 1);
  await expect(durations.nth(0)).toHaveCSS("color", "rgb(221, 221, 221)");
  await expect(durations.nth(1)).toHaveCSS("color", "rgb(238, 238, 238)");

  await page.evaluate(() => {
    const player = BeyondWords.Player.instances()[0];
    player.lightTheme.textColor = "#abcdef";
    player.lightTheme.secondaryTextColor = "#fedcba";
  });
  await expect(durations.nth(0)).toHaveCSS("color", "rgb(254, 220, 186)");
  await expect(durations.nth(1)).toHaveCSS("color", "rgb(171, 205, 239)");
});

const hasHover = (page) => page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches);

const showQueue = async (page, theme) => {
  await page.goto("http://localhost:8000");
  await waitForStylesToLoad(page);
  await resetPlayerProps(page);

  await page.evaluate((theme) => {
    const player = BeyondWords.Player.instances()[0];
    const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 30 }];

    Object.assign(player, {
      playerStyle: "default",
      widgetStyle: "none",
      playlistStyle: "show",
      theme,
      contentIndex: 0,
      content: [
        { title: "First item", audio },
        { title: "Second item", audio },
      ],
    });
  }, theme);

  await expect(page.locator(".default-player .queue")).toBeVisible();
  await page.mouse.move(0, 0);
};

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
