import { test, expect } from "@playwright/test";
import { itemImage, advertImage } from "../support/base64Images.ts";
import permutations from "../support/permutations.ts";

const dimensions = {
  playerStyle: ["large", "screen", "small", "standard", "video"],
  playbackState: ["paused", "playing", "stopped"],
  adverts: [
    [{ clickThroughUrl: "https://deliveroo.com", imageUrl: advertImage, iconColor: "#00cdbc" }],
    [{ clickThroughUrl: "https://advert-without-image.com" }],
  ],
  advertIndex: [0, -1],
  playerTitle: [`A ${"very ".repeat(50)} long player title`],
  contentIndex: [0],
  currentTime: [10],
  content: [
    [{ title: "A reasonable length podcast title", imageUrl: itemImage, sourceUrl: "https://example.com" }],
    [{ title: `A ${"very ".repeat(50)} long title` }, ...Array(10).fill({ title: "Another playlist item" })],
  ],
  widgetPosition: [null, "auto", "center", "left", "right"],
  widgetStyle: ["none"],
  widgetWidth: [0, "50%", "auto"],
  playlistStyle: ["auto"],
};

test("screenshot comparison", async ({ page }) => {
  await page.goto("http://localhost:8000");

  for (const params of permutations(dimensions)) {
    if (skipPermutation(params)) { continue; }

    params.duration = params.advertIndex === 0 ? 15 : 30;
    params.widgetStyle = params.widgetPosition ? params.playerStyle : "none";

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
  }
});

const skipPermutation = (params) => {
  const testingTheWidget = params.widgetPosition;
  const testingNoImage = !params.adverts[0].imageUrl;

  const advertWouldntShow = params.advertIndex === 0 && params.playbackState === "stopped";
  if (advertWouldntShow) { return true; }

  const advertImageIsIrrelevant = testingNoImage && (params.advertIndex === -1 || ["small", "standard"].includes(params.playerStyle));
  if (advertImageIsIrrelevant) { return true; }

  const playlistWouldntShow = (testingTheWidget || params.playerStyle === "small") && params.content.length > 1;
  if (playlistWouldntShow) { return true; }

  const widthIsIrrelevant = !testingTheWidget && params.widgetWidth !== "auto";
  if (widthIsIrrelevant) { return true; }

  return false;
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
