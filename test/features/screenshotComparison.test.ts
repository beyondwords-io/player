import { test, expect } from "@playwright/test";
import { podcastImage, advertImage } from "../support/base64Images.ts";
import permutations from "../support/permutations.ts";

const dimensions = {
  interfaceStyle: ["small", "standard", "large", "screen", "video"],
  playbackState: ["stopped", "playing", "paused"],
  currentAdvert: [null, { url: "https://deliveroo.com", image: advertImage, duration: 15 }],
  playerTitle: [`A ${"very ".repeat(50)} long player title`],
  podcastIndex: [0],
  currentTime: [10],
  podcasts: [
    [{ title: "A reasonable length podcast title", image: podcastImage, duration: 30, externalUrl: "https://example.com" }],
    [{ title: `A ${"very ".repeat(50)} long title`, duration: 30 }, ...Array(10).fill({ title: "Another playlist item" })],
  ],
  widgetStyle: ["none"],
  widgetPosition: [null, "left", "center", "right"],
  widgetWidth: ["auto", 0, "50%"],
};

test("screenshot comparison", async ({ page }) => {
  await page.goto("http://localhost:8000");

  for (const params of permutations(dimensions)) {
    if (params.widgetPosition) { continue; } // TODO: remove

    if (params.playbackState === "stopped" && params.currentAdvert) { continue; }
    if (params.interfaceStyle === "small" && params.podcasts.length === 1) { continue; }

    if (!params.widgetPosition && params.widgetWidth !== "auto") { continue; }
    if (params.widgetPosition) { params.widgetStyle = params.interfaceStyle; }

    const bounds = await page.evaluate(async (params) => {
      const player = BeyondWords.Player.instances()[0];
      Object.entries(params).forEach(([k, v]) => player[k] = v);

      const [scroll, selector] = params.widgetPosition ? [99999, ".fixed"] : [0, ":not(.fixed)"];
      window.scrollTo(0, scroll);

      const userInterface = player.target.querySelector(`.user-interface${selector}`);
      return userInterface.getBoundingClientRect();
    }, params);

    await expect(page).toHaveScreenshot(`${screenshotName(params)}.png`, { clip: bounds });
  }
});

const screenshotName = (params) => (
  [
    params.interfaceStyle,
    params.playbackState,
    params.currentAdvert && "advert",
    params.podcasts.length > 1 && "playlist",
    params.widgetPosition && `widget-${params.widgetPosition}-${params.widgetWidth}`,
  ].filter(s => s).join("-")
);
