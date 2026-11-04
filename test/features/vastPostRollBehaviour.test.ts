import { test, expect } from "@playwright/test";

// The content is restored after a post-roll and ends again, so the same advert
// mustn't be chosen there twice. VAST adverts aren't skipped as played media,
// so a post-roll used to play again and again. Google IMA is stubbed: each VAST
// advert plays for 300ms, or fails like a no-fill when its URL says so, and
// window.whileVastPlays runs 100ms in. The Player API is mocked and every clip
// is generated silence.

const imaStub = `(() => {
  const T = { ADS_MANAGER_LOADED: "loaded", AD_ERROR: "error", STARTED: "started", AD_PROGRESS: "progress", CLICK: "click", PAUSED: "paused", CONTENT_RESUME_REQUESTED: "resume" };
  class Emitter { listeners = {}; addEventListener(type, f) { (this.listeners[type] ||= []).push(f); } emit(type, e) { (this.listeners[type] || []).forEach(f => f(e)); } }

  class AdsManager extends Emitter {
    constructor(url) { super(); this.url = url; }
    init() {} resize() {} resume() {} pause() {} destroy() { this.destroyed = true; }
    start() {
      window.played.push("vast:" + new URL(this.url).pathname.split("/").pop());
      setTimeout(() => this.destroyed || this.emit(T.STARTED, { getAd: () => ({ getCompanionAds: () => [] }) }), 20);
      setTimeout(() => this.destroyed || window.whileVastPlays?.(), 100);
      setTimeout(() => this.destroyed || this.emit(T.CONTENT_RESUME_REQUESTED, {}), 300);
    }
  }

  class AdsLoader extends Emitter {
    requestAds({ adTagUrl }) {
      const error = { getError: () => ({ getMessage: () => "No ads VAST response", getErrorCode: () => 303 }) };
      const loaded = { getAdsManager: () => new AdsManager(adTagUrl) };
      setTimeout(() => adTagUrl.includes("/no-fill/") ? this.emit(T.AD_ERROR, error) : this.emit(T.ADS_MANAGER_LOADED, loaded), 10);
    }
  }

  window.google = { ima: {
    settings: { setDisableCustomPlaybackForIOS10Plus() {} },
    AdDisplayContainer: class { initialize() {} },
    AdsLoader, AdsRequest: class {}, AdsRenderingSettings: class {},
    AdsManagerLoadedEvent: { Type: T }, AdErrorEvent: { Type: T }, AdEvent: { Type: T },
    CompanionAdSelectionSettings: Object.assign(class {}, { ResourceType: {}, CreativeType: {}, SizeCriteria: {} }),
    ViewMode: { NORMAL: "normal" },
  } };
})();`;

test.beforeEach(async ({ page }) => {
  await page.route(/imasdk\.googleapis\.com/, route => route.fulfill({ contentType: "application/javascript", body: imaStub }));
  await page.goto("http://localhost:8000");
  await waitForStylesToLoad(page);

  await page.evaluate(() => {
    window.disableAnimation = true;
    BeyondWords.Player.destroyAll();
  });
});

const tier = (segmentLimit) => ({
  slug: "anonymous", segment_limit: segmentLimit, cta_text: "Subscribe", cta_url: null, summary: { allowed: true },
});

test("vast post-roll behaviour: single content plays the post-roll once, then the outro, and again on replay", async ({ page }) => {
  await loadPlayer(page, { content: 1, outro: true, ads: ["vast:post-roll"] });

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "vast:post-roll", "outro"]);

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "vast:post-roll", "outro"]);
});

test("vast post-roll behaviour: a playlist plays the post-roll once after the last item", async ({ page }) => {
  // VAST adverts aren't skipped as played media, so one plays between items too.
  await loadPlayer(page, { content: 3, ads: ["vast:post-roll"], playlist: true });

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "vast:post-roll", "content#1", "vast:post-roll", "content#2", "vast:post-roll"]);
});

test("vast post-roll behaviour: an article playlist on a preview tier plays the post-roll once after the first article", async ({ page }) => {
  await loadPlayer(page, { content: 3, ads: ["vast:post-roll"], accessTier: tier(2), playlist: true });

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "vast:post-roll"]);
});

test("vast post-roll behaviour: an article playlist on a preview tier plays the post-roll once where the limit cuts off the first article", async ({ page }) => {
  await loadPlayer(page, { content: 3, long: true, ads: ["vast:post-roll"], accessTier: tier(1), playlist: true });

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "vast:post-roll"]);

  expect(await page.evaluate(() => window.events.filter(type => type === "SegmentLimitReached").length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => [player.contentIndex, player.currentTime])).toEqual([0, 0]);
});

test("vast post-roll behaviour: a title-only tier plays the post-roll once", async ({ page }) => {
  await loadPlayer(page, { content: 3, ads: ["vast:post-roll"], accessTier: tier(0), playlist: true });

  await pressPlay(page);
  await expectPlayed(page, ["vast:post-roll"]);
});

test("vast post-roll behaviour: an article picked during the post-roll gets its own post-roll", async ({ page }) => {
  await loadPlayer(page, { content: 3, long: true, ads: ["vast:post-roll"], accessTier: tier(1), playlist: true });
  await pressWhileVastPlays(page, { type: "PressedPlaylistItem", index: 1 });

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "vast:post-roll", "content#1", "vast:post-roll"]);
  expect(await page.evaluate(() => [player.contentIndex, player.currentTime])).toEqual([1, 0]);
});

test("vast post-roll behaviour: pressing the article during its post-roll doesn't play the post-roll again", async ({ page }) => {
  // The advert restores the article to where the limit cut it off.
  await loadPlayer(page, { content: 3, long: true, ads: ["vast:post-roll"], accessTier: tier(1), playlist: true });
  await pressWhileVastPlays(page, { type: "PressedPlaylistItem", index: 0 });

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "vast:post-roll"]);
  expect(await pressed(page, "PressedPlaylistItem")).toBe(1);
});

test("vast post-roll behaviour: going back to the article during its post-roll doesn't play the post-roll again", async ({ page }) => {
  await loadPlayer(page, { content: 3, long: true, ads: ["vast:post-roll"], accessTier: tier(1), playlist: true });
  await pressWhileVastPlays(page, { type: "PressedPlaylistItem", index: 1 }, { type: "PressedPlaylistItem", index: 0 });

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "vast:post-roll"]);
  expect(await pressed(page, "PressedPlaylistItem")).toBe(2);
});

test("vast post-roll behaviour: a custom post-roll still plays when the VAST post-roll has no fill", async ({ page }) => {
  await loadPlayer(page, { content: 1, ads: ["no-fill:post-roll", "custom:post-roll"] });

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "ad:post-roll"]);
});

// content: the number of articles. long: whether they last two seconds, so that
// a limit of one segment cuts them off a second in. ads: "<kind>:<placement>",
// where kind is vast, no-fill (a VAST advert that fails) or custom. Every clip
// has its own duration so that its URL is unique: played media is tracked by URL.
const loadPlayer = async (page, { content, long = false, outro = false, ads = [], accessTier, playlist = false }) => {
  const labels = {};
  const audio = (label, duration = 400 + 20 * Object.keys(labels).length) => {
    const url = silentAudio(duration);
    labels[url] = label;
    return [{ id: Object.keys(labels).length, url, content_type: "audio/wav", duration }];
  };

  const half = long ? 1000 : 200;

  const item = (i) => ({
    id: `00000000-0000-4000-8000-00000000000${i}`, title: `Item ${i}`, ads_enabled: true,
    audio: audio(`content#${i}`, long ? 2 * half + 20 * i : undefined), video: [],
    summarization: { audio: [], video: [] },
    segments: [
      { marker: `item-${i}-a`, section: "body", start_time: 0, duration: half },
      { marker: `item-${i}-b`, section: "body", start_time: half, duration: half },
    ],
  });

  const advert = (ad, i) => {
    const [kind, placement] = ad.split(":");
    if (kind === "custom") { return { id: i + 1, type: "custom", placement, audio: audio(`ad:${placement}`), video: [] }; }
    return { id: i + 1, type: "vast", placement, vast_url: `https://vast.invalid/${kind}/${placement}`, audio: [], video: [] };
  };

  const response = {
    language: "en",
    settings: {
      player_style: "standard", theme: "light", embed_mode: "audio", variants: ["article"],
      analytics_enabled: false, outro_playback_mode: "after-all",
      intros_outros: outro ? [{ placement: "post-roll", audio: audio("outro"), video: [] }] : [],
    },
    video_settings: { logo_image_position: "top-right" },
    ...(accessTier ? { access_tier: accessTier } : {}),
    ads: ads.map(advert),
    content: Array.from({ length: content }, (_, i) => item(i)),
  };

  await page.route(/api\.beyondwords\.io\/v1\/projects\/\d+\/player\//, route => route.fulfill({
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(response),
  }));

  await page.evaluate(([labels, playlist]) => {
    window.player = new BeyondWords.Player({
      target: ".beyondwords-player",
      widgetStyle: "none",
      projectId: 1,
      ...(playlist ? { playlistId: 1 } : { contentId: "00000000-0000-4000-8000-000000000000" }),
    });
    window.video = () => document.querySelector(".beyondwords-player video");
    window.events = [];
    player.addEventListener("<any>", ({ type }) => window.events.push(type));

    // A clip counts as played once the browser has rendered 0.1s of it. Seeks,
    // e.g. restoring the content to its end after a post-roll, don't count. The
    // IMA stub adds VAST adverts when they start.
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
  }, [labels, playlist]);

  await expect.poll(() => page.evaluate(() => player.content.length)).toBe(content);
};

const pressPlay = async (page) => {
  await page.evaluate(() => window.resetPlayed());
  await page.locator(".beyondwords-player .play-pause-button").first().click();
};

// The first VAST advert to play sends these user events, in order, while it plays.
const pressWhileVastPlays = (page, ...events) => page.evaluate((events) => {
  window.whileVastPlays = async () => {
    delete window.whileVastPlays;
    for (const event of events) {
      await player.onEvent({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "pending", description: "Pressed during the advert.", initiatedBy: "user", ...event });
    }
  };
}, events);

const pressed = (page, type) => page.evaluate((type) => window.events.filter(t => t === type).length, type);

const state = (page) => page.evaluate(() => ({ played: window.played, playbackState: player.playbackState }));

// Playback stops and stays stopped: a post-roll that repeats would restart it.
const expectPlayed = async (page, played) => {
  await expect.poll(() => state(page), { timeout: 15000 }).toEqual({ played, playbackState: "stopped" });
  await page.waitForTimeout(1000);
  expect(await state(page)).toEqual({ played, playbackState: "stopped" });
};

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
