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
    [{ title: "A podcast title of reasonable length", image: podcastImage, duration: 30, externalUrl: "https://example.com" }],
    [{ title: `A ${"very ".repeat(50)} long title`, duration: 30 }, { title: "Second playlist item", duration: 30 }],
  ],
};

for (const params of permutations(dimensions)) {
  if (params.playbackState === "stopped" && params.currentAdvert) { continue; }
  if (params.interfaceStyle === "small" && params.podcasts.length === 1) { continue; }

  const testName = [
    params.interfaceStyle,
    params.playbackState,
    params.currentAdvert ? "advert" : "content",
    params.podcasts.length > 1 ? "playlist" : "single",
  ].join("-");

  test(testName, async ({ page }) => {
    await page.goto("http://localhost:8000");

    const bounds = await page.evaluate(async (params) => {
      const player = BeyondWords.Player.instances()[0];

      for (const [key, value] of Object.entries(params)) {
        player[key] = value;
      }

      return player.target.getBoundingClientRect();
    }, params);

    await expect(page).toHaveScreenshot({ clip: bounds });
  });
}
