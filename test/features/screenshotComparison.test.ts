import { test, expect } from "@playwright/test";
import { podcastImage, advertImage } from "../support/base64Images.ts";
import permutations from "../support/permutations.ts";

const dimensions = {
  widgetPosition: [null, "auto", "left", "center", "right"],
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
  widgetWidth: ["auto", 0, "50%"],
};

test("screenshot comparison", async ({ page }) => {
  await page.goto("http://localhost:8000");

  for (const params of permutations(dimensions)) {
    if (skipPermutation(params)) { continue; }

    if (params.widgetPosition) { params.widgetStyle = params.interfaceStyle; }

    const bounds = await page.evaluate(async (params) => {
      const player = BeyondWords.Player.instances()[0];
      Object.entries(params).forEach(([k, v]) => player[k] = v);

      const scroll = document.documentElement.scrollTop ? 99999 : 0;
      const expected = params.widgetPosition ? 99999 : 0;

      if (scroll !== expected) { window.scrollTo(0, expected); }

      await new Promise(resolve => setTimeout(resolve, 200));
      const selector = params.widgetPosition ? ".fixed" : ":not(.fixed)";

      const userInterface = player.target.querySelector(`.user-interface${selector}`);
      return userInterface.getBoundingClientRect();
    }, params);

    await expect(page).toHaveScreenshot(`${screenshotName(params)}.png`, { clip: bounds });
    process.stdout.write(".");
  }
});

const skipPermutation = (params) => {
  const testingTheWidget = params.widgetPosition;

  const advertWouldntShow = params.currentAdvert && params.playbackState === "stopped";
  if (advertWouldntShow) { return true; }

  const playlistWouldntShow = (testingTheWidget || params.interfaceStyle === "small") && params.podcasts.length > 1;
  if (playlistWouldntShow) { return true; }

  const widthIsIrrelevant = !testingTheWidget && params.widgetWidth !== "auto";
  if (widthIsIrrelevant) { return true; }

  return false;
};

const screenshotName = (params) => (
  [
    params.interfaceStyle,
    params.playbackState,
    params.currentAdvert && "advert",
    params.podcasts.length > 1 && "playlist",
    params.widgetPosition && `widget-${params.widgetPosition}-${params.widgetWidth}`.replace("%", ""),
  ].filter(s => s).join("-")
);
