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

test("screenshot comparison", async ({ page }) => {
  await page.goto("http://localhost:8000");

  for (const params of permutations(dimensions)) {
    if (params.playbackState === "stopped" && params.currentAdvert) { continue; }
    if (params.interfaceStyle === "small" && params.podcasts.length === 1) { continue; }

    const bounds = await page.evaluate(async (params) => {
      const player = BeyondWords.Player.instances()[0];
      Object.entries(params).forEach(([k, v]) => player[k] = v);

      const userInterface = player.target.querySelector(".user-interface")
      return userInterface.getBoundingClientRect();
    }, params);

    const screenshotName = [
      params.interfaceStyle,
      params.playbackState,
      params.currentAdvert ? "advert" : "content",
      params.podcasts.length > 1 ? "playlist" : "single",
    ].join("-");

    await expect(page).toHaveScreenshot(`${screenshotName}.png`, { clip: bounds });
  }
});
