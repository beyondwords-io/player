import { test, expect } from "@playwright/test";
import { podcastImage, advertImage } from "../support/base64Images.ts";
import permutations from "../support/permutations.ts";

const dimensions = {
  interfaceStyle: ["large", "screen", "small", "standard", "video"],
  playbackState: ["paused", "playing", "stopped"],
  currentAdvert: [{ url: "https://deliveroo.com", image: advertImage, duration: 15 }, null],
  playerTitle: [`A ${"very ".repeat(50)} long player title`],
  podcastIndex: [0],
  currentTime: [10],
  podcasts: [
    [{ title: "A reasonable length podcast title", image: podcastImage, duration: 30, externalUrl: "https://example.com" }],
    [{ title: `A ${"very ".repeat(50)} long title`, duration: 30 }, ...Array(10).fill({ title: "Another playlist item" })],
  ],
  widgetPosition: [null, "auto", "center", "left", "right"],
  widgetStyle: ["none"],
  widgetWidth: [0, "50%", "auto"],
};

test("screenshot comparison", async ({ page }) => {
  await page.goto("http://localhost:8000");

  for (const params of permutations(dimensions)) {
    if (skipPermutation(params)) { continue; }

    if (params.widgetPosition) { params.widgetStyle = params.interfaceStyle; }

    await page.evaluate(async (params) => {
      const player = BeyondWords.Player.instances()[0];
      Object.entries(params).forEach(([k, v]) => player[k] = v);

      window.scrollTo(0, params.widgetPosition ? 99999 : 0);
      await new Promise(resolve => setTimeout(resolve, 100));
    }, params);

    const selector = params.widgetPosition ? ".fixed" : ":not(.fixed)";
    const userInterface = page.locator(`.user-interface${selector}`);

    const name = `${screenshotName(params)}.png`;
    await expect(userInterface).toHaveScreenshot(name, { fullPage: true, maxDiffPixelRatio: 0.02 });

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
