import { test, expect } from "@playwright/test";

// Exercise the public constructor and an asynchronous /player response: a
// helper-only test misses the reactive variant selection that overwrote summary.
const cases = [
  { name: "explicit summary", props: { summary: true }, variants: ["article"], expected: true, initial: true },
  { name: "explicit article", props: { summary: false }, variants: ["summary"], expected: false, initial: false },
  { name: "legacy summary alias", props: { loadContentAs: ["summary"] }, variants: ["article"], expected: true, initial: true },
  { name: "dashboard summary default", props: {}, variants: ["summary"], expected: true, initial: false },
  { name: "dashboard article default", props: {}, variants: ["article"], expected: false, initial: false },
  { name: "explicit single variant", props: { variants: ["summary"] }, variants: ["article"], expected: true, initial: true },
];

for (const playerStyle of ["default", "standard"]) {
  for (const scenario of cases) {
    test(`summary override behaviour: ${playerStyle}, ${scenario.name}`, async ({ page }) => {
      const requests = [];
      await page.route("http://localhost:8000/test-media/**", route => route.fulfill({
        contentType: "audio/wav", body: silentAudio(),
      }));
      await page.route("http://localhost:8000/test-api/**", route => {
        const url = new URL(route.request().url());
        requests.push(url);
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            language: "en",
            content: [{
              id: url.pathname.split("/").pop(), title: "Article",
              audio: [media("article")], video: [],
              summarization: { audio: [media("summary")], video: [] },
              segments: [],
            }],
            settings: {
              player_style: playerStyle, theme: "light", intros_outros: [],
              variants: scenario.variants, embed_mode: "audio", analytics_enabled: false,
            },
            video_settings: {}, ads: [],
          }),
        });
      });

      await page.goto("http://localhost:8000");
      await page.waitForFunction(() => !!window.BeyondWords?.Player);
      await page.evaluate((props) => {
        BeyondWords.Player.destroyAll();
        window.disableAnimation = true;
        new BeyondWords.Player({
          target: "#player", widgetStyle: "none", projectId: 7, contentId: "first",
          playerApiUrl: "http://localhost:8000/test-api/projects/{id}/player",
          ...props,
        });
      }, scenario.props);

      // Check after content arrives, and again after refetching it. Checking
      // only the constructor value would pass before the dashboard overwrote it.
      for (const contentId of ["first", "second"]) {
        if (contentId === "second") {
          await page.evaluate(() => BeyondWords.Player.instances()[0].contentId = "second");
        }
        await expect.poll(() => page.evaluate(() => {
          const player = BeyondWords.Player.instances()[0];
          return { contentId: player.content[0]?.id, summary: player.summary, style: player.playerStyle };
        })).toEqual({ contentId, summary: scenario.expected, style: playerStyle });
        await expect.poll(() => page.locator("#player video").evaluate(video => video.currentSrc))
          .toBe(`http://localhost:8000/test-media/${scenario.expected ? "summary" : "article"}.wav`);
      }

      expect(requests).toHaveLength(2);
      expect(requests[0].searchParams.get("summary")).toBe(scenario.initial ? "true" : null);
      expect(requests[1].searchParams.get("summary")).toBe(scenario.expected ? "true" : null);
    });
  }
}

const media = (variant) => ({
  id: variant === "article" ? 1 : 2,
  url: `http://localhost:8000/test-media/${variant}.wav`,
  content_type: "audio/wav", duration: 1000,
});

// One second of PCM silence lets the browser select and load real media while
// keeping these contract tests independent of external audio files or services.
const silentAudio = () => {
  const audio = Buffer.alloc(44 + 16000);
  audio.write("RIFF", 0);
  audio.writeUInt32LE(audio.length - 8, 4);
  audio.write("WAVEfmt ", 8);
  audio.writeUInt32LE(16, 16);
  audio.writeUInt16LE(1, 20);
  audio.writeUInt16LE(1, 22);
  audio.writeUInt32LE(8000, 24);
  audio.writeUInt32LE(16000, 28);
  audio.writeUInt16LE(2, 32);
  audio.writeUInt16LE(16, 34);
  audio.write("data", 36);
  audio.writeUInt32LE(16000, 40);
  return audio;
};
