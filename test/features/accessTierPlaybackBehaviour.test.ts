import { test, expect } from "@playwright/test";

// An access tier's segment_limit applies to the article: playback stops after
// each one instead of moving on to the next, while a summary playlist plays
// through. Neither continues to new items. The Player API is mocked and every
// clip is generated silence, so nothing touches the network.

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:8000");
  await waitForStylesToLoad(page);

  await page.evaluate(() => {
    window.disableAnimation = true;
    BeyondWords.Player.destroyAll();
  });
});

const tier = (segmentLimit, summaryAllowed = true) => ({
  slug: "anonymous", segment_limit: segmentLimit, cta_text: "Subscribe", cta_url: null, summary: { allowed: summaryAllowed },
});

test("access tier playback behaviour: an article playlist on a preview tier plays the post-roll after the first article", async ({ page }) => {
  await loadPlayer(page, { content: 3, intro: true, outro: true, ads: ["pre-roll", "post-roll"], accessTier: tier(2), playlist: true });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "ad:pre-roll", "content#0", "ad:post-roll"]);
});

test("access tier playback behaviour: an article playlist on a preview tier plays the post-roll where the limit cuts off the first article", async ({ page }) => {
  await loadPlayer(page, { content: 3, long: true, intro: true, outro: true, ads: ["pre-roll", "post-roll"], accessTier: tier(1), playlist: true });

  // The article doesn't resume after the post-roll: the advert unloaded it, so
  // the recorder would see it play again.
  await pressPlay(page);
  await expectPlayed(page, ["intro", "ad:pre-roll", "content#0", "ad:post-roll"]);

  expect(await page.evaluate(() => window.events)).toContain("SegmentLimitReached");
  expect(await page.evaluate(() => ({ contentIndex: player.contentIndex, currentTime: player.currentTime }))).toEqual({ contentIndex: 0, currentTime: 0 });
});

test("access tier playback behaviour: after a mid-roll, replaying an article cut off on a preview tier plays its preview from the start", async ({ page }) => {
  await loadPlayer(page, { content: 3, long: true, ads: ["post-roll", "mid-roll"], accessTier: tier(1), playlist: true });

  await pressPlay(page);
  await expect.poll(() => page.evaluate(() => window.played)).toEqual(["content#0"]);

  // Any advert can play between articles. Tie them, so that the later one wins.
  await page.evaluate(() => { window.random = Math.random; Math.random = () => 0; });
  await pressNextTrack(page);
  await page.evaluate(() => { Math.random = window.random; });
  await expectPlayed(page, ["content#0", "ad:mid-roll", "content#1", "ad:post-roll"]);

  // The preview lasts a second. The replay used to jump back to where the limit
  // cut it off - the post-roll's restore point, which the mid-roll's restart
  // fix reapplies near the start - and stop at once.
  await page.evaluate(() => {
    window.replay = {};
    player.addEventListener("PlaybackPlaying", () => window.replay.startedAt ??= performance.now());
    player.addEventListener("SegmentLimitReached", () => window.replay.cutOffAfter ??= performance.now() - window.replay.startedAt);
  });
  await pressPlay(page);
  await expect.poll(() => page.evaluate(() => window.replay.cutOffAfter), { timeout: 15000 }).toBeGreaterThan(800);
});

test("access tier playback behaviour: replay on a preview tier starts with the intro again", async ({ page }) => {
  await loadPlayer(page, { content: 1, intro: true, outro: true, accessTier: tier(2) });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "content#0", "outro"]);

  await pressPlay(page);
  await expectPlayed(page, ["intro", "content#0", "outro"]);
});

test("access tier playback behaviour: after a preview tier stops, the next article starts with the intro", async ({ page }) => {
  await loadPlayer(page, { content: 2, intro: true, ads: ["pre-roll", "post-roll"], accessTier: tier(2), playlist: true });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "ad:pre-roll", "content#0", "ad:post-roll"]);

  await page.evaluate(() => window.resetPlayed());
  await pressNextTrack(page);
  await pressPlay(page);
  await expectPlayed(page, ["intro", "content#1"]);
});

test("access tier playback behaviour: a title-only tier plays the intro and adverts of a playlist, and the intro on replay", async ({ page }) => {
  await loadPlayer(page, { content: 2, intro: true, ads: ["pre-roll", "post-roll"], accessTier: tier(0), playlist: true });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "ad:pre-roll", "ad:post-roll"]);

  await pressPlay(page);
  await expectPlayed(page, ["intro"]);
});

test("access tier playback behaviour: a summary playlist plays through on a preview tier", async ({ page }) => {
  await loadPlayer(page, { content: 3, summaries: true, intro: true, outro: true, ads: ["pre-roll", "post-roll"], accessTier: tier(2), playlist: true, options: { summary: true } });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "ad:pre-roll", "summary#0", "ad:post-roll", "summary#1", "summary#2", "outro"]);
});

test("access tier playback behaviour: continuous playback doesn't append to a summary on a preview tier", async ({ page }) => {
  await loadPlayer(page, { content: 1, summaries: true, accessTier: tier(2), continuous: 3, options: { summary: true } });

  await pressPlay(page);
  await expectPlayed(page, ["summary#0"]);
  expect(await page.evaluate(() => player.content.length)).toEqual(1);
});

test("access tier playback behaviour: continuous playback doesn't append to an article on a preview tier", async ({ page }) => {
  await loadPlayer(page, { content: 1, accessTier: tier(2), continuous: 3 });

  await pressPlay(page);
  await expectPlayed(page, ["content#0"]);
  expect(await page.evaluate(() => player.content.length)).toEqual(1);
});

test("access tier playback behaviour: summary true on a tier without the summary plays the intro, pre-roll and outro of a playlist", async ({ page }) => {
  await loadPlayer(page, { content: 3, summaries: true, intro: true, outro: true, ads: ["pre-roll"], accessTier: tier(2, false), playlist: true, options: { summary: true } });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "ad:pre-roll", "outro"]);
});

test("access tier playback behaviour: continuous playback doesn't move on from an item without media", async ({ page }) => {
  // Each next item is empty too, so this used to play the outro once per item.
  await loadPlayer(page, { content: 1, summaries: true, intro: true, outro: true, accessTier: tier(null, false), continuous: 5, options: { summary: true } });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "outro"]);
  expect(await page.evaluate(() => player.content.length)).toEqual(1);
});

// content: the number of articles. summaries: whether they have a summary,
// which the backend leaves out when the tier doesn't allow it. long: whether
// the articles last two seconds, so that a limit of one segment cuts them off a
// second in. continuous: the length of the chain that continuous playback can
// fetch, one item at a time.
// Every clip has its own duration so that its URL is unique: played media is
// tracked by URL.
const loadPlayer = async (page, { content, summaries = false, long = false, intro = false, outro = false, ads = [], accessTier, playlist = false, continuous = 0, options = {} }) => {
  const labels = {};
  const audio = (label, duration = 400 + 20 * Object.keys(labels).length) => {
    const url = silentAudio(duration);
    labels[url] = label;
    return [{ id: Object.keys(labels).length, url, content_type: "audio/wav", duration }];
  };

  const id = (i) => `00000000-0000-4000-8000-00000000000${i}`;
  const withSummary = summaries && accessTier?.summary?.allowed !== false;

  const half = long ? 1000 : 200;

  const item = (i) => ({
    id: id(i), title: `Item ${i}`, ads_enabled: true,
    audio: audio(`content#${i}`, long ? 2 * half + 20 * i : undefined), video: [],
    summarization: { audio: withSummary ? audio(`summary#${i}`) : [], video: [] },
    segments: [
      { marker: `item-${i}-a`, section: "body", start_time: 0, duration: half },
      { marker: `item-${i}-b`, section: "body", start_time: half, duration: half },
    ],
  });

  const items = Array.from({ length: Math.max(content, continuous) }, (_, i) => item(i));

  const response = (contentItems, nextIndex) => ({
    language: "en",
    settings: {
      player_style: "standard", theme: "light", embed_mode: "audio", variants: ["article", "summary"],
      analytics_enabled: false, outro_playback_mode: "after-all",
      intros_outros: [
        intro && { placement: "pre-roll", audio: audio("intro"), video: [] },
        outro && { placement: "post-roll", audio: audio("outro"), video: [] },
      ].filter(Boolean),
    },
    video_settings: { logo_image_position: "top-right" },
    ...(accessTier ? { access_tier: accessTier } : {}),
    ads: ads.map((placement, i) => ({
      id: i + 1, type: "custom", placement, audio: audio(`ad:${placement}`), video: [],
    })),
    content: contentItems,
    ...(nextIndex < continuous ? { continuous_playback_content_id: id(nextIndex) } : {}),
  });

  const responses = items.map((it, i) => response(i === 0 ? items.slice(0, content) : [it], i === 0 ? content : i + 1));

  await page.route(/api\.beyondwords\.io\/v1\/projects\/\d+\/player\//, route => {
    const i = items.findIndex((_, i) => i > 0 && route.request().url().includes(`by_content_id/${id(i)}`));

    return route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(responses[Math.max(i, 0)]),
    });
  });

  await page.evaluate(([labels, playlist, options]) => {
    window.player = new BeyondWords.Player({
      target: ".beyondwords-player",
      widgetStyle: "none",
      projectId: 1,
      ...(playlist ? { playlistId: 1 } : { contentId: "00000000-0000-4000-8000-000000000000" }),
      ...options,
    });
    window.video = () => document.querySelector(".beyondwords-player video");
    window.events = [];
    player.addEventListener("<any>", ({ type }) => window.events.push(type));

    // A clip counts as played once the browser has rendered 0.1s of it. Seeks,
    // e.g. restoring the content to its end after a post-roll, don't count.
    // Nor does replaying a clip that is still loaded: video.played won't grow.
    let baseline = 0;
    window.played = [];
    window.resetPlayed = () => { window.played = []; baseline = renderedSeconds(video()); };
    const renderedSeconds = (media) => {
      let total = 0;
      for (let i = 0; i < media.played.length; i += 1) { total += media.played.end(i) - media.played.start(i); }
      return total;
    };
    document.addEventListener("loadstart", () => baseline = 0, true);
    document.addEventListener("timeupdate", ({ target }) => {
      if (baseline === null || renderedSeconds(target) - baseline < 0.1) { return; }
      window.played.push(labels[target.currentSrc]);
      baseline = null;
    }, true);
  }, [labels, playlist, options]);

  await expect.poll(() => page.evaluate(() => player.content.length)).toBe(content);
};

const pressPlay = async (page) => {
  await page.evaluate(() => window.resetPlayed());
  await page.locator(".beyondwords-player .play-pause-button").first().click();
};

const pressNextTrack = (page) => page.evaluate(() => {
  player.onEvent({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    type: "PressedNextTrack",
    description: "The next track button was pressed.",
    initiatedBy: "user",
  });
});

const state = (page) => page.evaluate(() => ({ played: window.played, playbackState: player.playbackState }));

const expectPlayed = (page, played) => (
  expect.poll(() => state(page), { timeout: 15000 }).toEqual({ played, playbackState: "stopped" })
);

// PCM silence, as a data URL so that no request is made for the media.
const silentAudio = (milliseconds) => {
  const bytes = 2 * Math.round(8 * milliseconds);
  const audio = Buffer.alloc(44 + bytes);
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
  audio.writeUInt32LE(bytes, 40);
  return `data:audio/wav;base64,${audio.toString("base64")}`;
};

const waitForStylesToLoad = async (page) => {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      setInterval(() => BeyondWords.Player._styleLoaded && resolve(), 100);
    });
  });
};
