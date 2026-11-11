import { test, expect } from "@playwright/test";

// The content mustn't play while a VAST advert loads. A pre-roll's content used
// to play until IMA paused it, then start again after the advert. A mid-roll,
// or a post-roll at a segment limit, sent the content back to its start, which
// played until IMA paused it. Google IMA is stubbed: an ad request takes
// window.requestDelay, then the advert plays for 500ms, or the request fails
// like a no-fill when its URL says so. The Player API is mocked, the article is
// 24s of generated silence in 4s segments, and its mid-roll is at 12s.

const imaStub = `(() => {
  const T = { ADS_MANAGER_LOADED: "loaded", AD_ERROR: "error", STARTED: "started", AD_PROGRESS: "progress", CLICK: "click", PAUSED: "paused", CONTENT_RESUME_REQUESTED: "resume" };
  class Emitter { listeners = {}; addEventListener(type, f) { (this.listeners[type] ||= []).push(f); } emit(type, e) { (this.listeners[type] || []).forEach(f => f(e)); } }

  class AdsManager extends Emitter {
    init() {} resize() {} resume() {} pause() {} destroy() { this.destroyed = true; }
    start() {
      setTimeout(() => this.destroyed || (window.advertsStarted += 1, this.emit(T.STARTED, { getAd: () => ({ getCompanionAds: () => [] }) })), 20);
      setTimeout(() => this.destroyed || this.emit(T.CONTENT_RESUME_REQUESTED, {}), 500);
    }
  }

  class AdsLoader extends Emitter {
    requestAds({ adTagUrl }) {
      window.adRequests.push(new URL(adTagUrl).pathname);
      const error = { getError: () => ({ getMessage: () => "No ads VAST response", getErrorCode: () => 303 }) };
      const loaded = { getAdsManager: () => new AdsManager() };
      setTimeout(() => adTagUrl.includes("/no-fill/") ? this.emit(T.AD_ERROR, error) : this.emit(T.ADS_MANAGER_LOADED, loaded), window.requestDelay);
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

test("vast loading behaviour: the content doesn't play while a pre-roll loads, then plays once from the start", async ({ page }) => {
  await loadPlayer(page, { ads: ["vast:pre-roll"], requestDelay: 1500 });

  await pressPlay(page);
  await waitForContent(page, 1);

  expect(await page.evaluate(() => window.advertsStarted)).toBe(1);
  expect(await heardFrom(page)).toEqual([0]);
});

test("vast loading behaviour: the content doesn't play while a pre-roll loads if its data arrives after play is pressed", async ({ page }) => {
  // Its play() is still pending when the pre-roll pauses it, which used to retry it.
  await loadPlayer(page, { ads: ["vast:pre-roll"], requestDelay: 1500, startAt: 20, lateData: true });

  await pressPlay(page);
  await waitForContent(page, 0.5);

  expect(await page.evaluate(() => window.advertsStarted)).toBe(1);
  expect(await playedDuringAdverts(page)).toBe(0);
});

test("vast loading behaviour: the content pauses while a mid-roll loads, then resumes once from where it paused", async ({ page }) => {
  // The mid-roll is preloaded from 7s but is still loading when the content reaches 12s.
  await loadPlayer(page, { ads: ["vast:mid-roll"], requestDelay: 4000, startAt: 9 });

  await pressPlay(page);
  await waitForContent(page, 13);

  expect(await page.evaluate(() => window.advertsStarted)).toBe(1);
  expect(await heardFrom(page)).toEqual([9, 12]);
  expect(await gapAtTheAdvert(page)).toBeLessThan(0.3);
});

test("vast loading behaviour: the content stays where a segment limit stopped it while the post-roll loads", async ({ page }) => {
  await loadPlayer(page, { ads: ["vast:post-roll"], requestDelay: 1500, startAt: 5, segmentLimit: 2 });

  await pressPlay(page);
  await expect.poll(() => page.evaluate(() => [window.advertsStarted, player.playbackState]), { timeout: 15000 }).toEqual([1, "stopped"]);

  expect(await heardFrom(page)).toEqual([5]);
});

test("vast loading behaviour: a mid-roll whose preload has no fill isn't requested again once its ban expires", async ({ page }) => {
  await loadPlayer(page, { ads: ["no-fill:mid-roll"], requestDelay: 300, startAt: 9 });

  await pressPlay(page);
  await expect.poll(() => page.evaluate(() => [window.adRequests.length, player.preloadAdvertIndex]), { timeout: 15000 }).toEqual([1, -1]);

  // VAST URLs that error are banned for 60 seconds.
  await page.evaluate(() => window.clockOffset = 61000);
  await waitForContent(page, 14);

  expect(await page.evaluate(() => window.adRequests)).toEqual(["/no-fill/mid-roll"]);
  expect(await heardFrom(page)).toEqual([9]);
});

// ads: "<kind>:<placement>", where kind is vast or no-fill (a VAST advert that
// fails). startAt: where the content starts. segmentLimit: an access tier's limit.
// lateData: the content is an MP3 fetched by range. Its first 16s arrive at once
// and the rest 300ms after play is pressed.
const loadPlayer = async (page, { ads, requestDelay, startAt = 0, segmentLimit, lateData = false }) => {
  const audio = { id: 1, url: silentAudio(24000), content_type: "audio/wav", duration: 24000 };

  if (lateData) {
    const mp3 = silentMp3(24000);
    Object.assign(audio, { url: "https://media.invalid/content.mp3", content_type: "audio/mpeg" });

    await page.route(audio.url, async route => {
      const start = Number(/bytes=(\d+)-/.exec(route.request().headers().range || "bytes=0-")[1]);
      const end = start === 0 ? 65535 : mp3.length - 1;

      if (start > 0) { await expect.poll(() => page.evaluate(() => window.pressedAt < performance.now() - 300), { timeout: 15000 }).toBe(true); }
      await route.fulfill({ status: 206, headers: { "content-type": "audio/mpeg", "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${mp3.length}` }, body: mp3.subarray(start, end + 1) });
    });
  }

  const response = {
    language: "en",
    settings: {
      player_style: "standard", theme: "light", embed_mode: "audio", variants: ["article"],
      analytics_enabled: false, outro_playback_mode: "after-all", intros_outros: [],
    },
    video_settings: { logo_image_position: "top-right" },
    ...(segmentLimit ? { access_tier: { slug: "anonymous", segment_limit: segmentLimit, cta_text: "Subscribe", cta_url: null, summary: { allowed: true } } } : {}),
    ads: ads.map((ad, i) => {
      const [kind, placement] = ad.split(":");
      return { id: i + 1, type: "vast", placement, vast_url: `https://vast.invalid/${kind}/${placement}`, audio: [], video: [] };
    }),
    content: [{
      id: "00000000-0000-4000-8000-000000000000", title: "Item", ads_enabled: true,
      audio: [audio], video: [],
      summarization: { audio: [], video: [] },
      segments: Array.from({ length: 6 }, (_, i) => ({ marker: `segment-${i}`, section: "body", start_time: 4000 * i, duration: 4000 })),
    }],
  };

  await page.route(/api\.beyondwords\.io\/v1\/projects\/\d+\/player\//, route => route.fulfill({
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(response),
  }));

  await page.evaluate(([requestDelay, startAt]) => {
    const now = Date.now;
    window.clockOffset = 0;
    Date.now = () => now() + window.clockOffset;

    window.requestDelay = requestDelay;
    window.adRequests = [];
    window.advertsStarted = 0;

    window.player = new BeyondWords.Player({
      target: ".beyondwords-player",
      widgetStyle: "none",
      projectId: 1,
      contentId: "00000000-0000-4000-8000-000000000000",
      minDurationForMidroll: 20,
      ...(startAt ? { currentTime: startAt } : {}),
    });
    window.video = () => document.querySelector(".beyondwords-player video");

    // The content element's position every 50ms. The stub's adverts don't use it.
    window.samples = [];
    setInterval(() => window.samples.push({ advertIndex: player.advertIndex, paused: video().paused, time: video().currentTime }), 50);
  }, [requestDelay, startAt]);

  await expect.poll(() => page.evaluate(() => player.content.length)).toBe(1);
  if (lateData) { await expect.poll(() => page.evaluate(() => [video().readyState, !!player.loadedMedia])).toEqual([1, true]); }
};

const pressPlay = async (page) => {
  await page.locator(".beyondwords-player .play-pause-button").first().click();
  await page.evaluate(() => window.pressedAt = performance.now());
};

const waitForContent = (page, time) => expect.poll(() => page.evaluate((time) => (
  player.advertIndex === -1 && !video().paused && video().currentTime > time
), time), { timeout: 15000 }).toBe(true);

// Stretches of content heard, i.e. played without a pause or a jump.
const heard = (page) => page.evaluate(() => {
  const stretches = [];
  let stretch = null;

  for (const { paused, time } of window.samples) {
    if (paused) { stretch = null; continue; }
    if (stretch && time >= stretch.to && time - stretch.to < 1) { stretch.to = time; continue; }

    stretch = { from: time, to: time };
    stretches.push(stretch);
  }

  return stretches.filter(({ from, to }) => to - from >= 0.1);
});

// Seconds of content played while an advert was active.
const playedDuringAdverts = (page) => page.evaluate(() => {
  let played = 0;

  window.samples.forEach((sample, i) => {
    const prev = window.samples[i - 1];
    const advanced = sample.time - prev?.time;

    if (prev && sample.advertIndex !== -1 && !prev.paused && !sample.paused && advanced > 0 && advanced < 1) { played += advanced; }
  });

  return Math.round(played * 10) / 10;
});

const heardFrom = async (page) => (await heard(page)).map(({ from }) => Math.round(from));

const gapAtTheAdvert = async (page) => {
  const [before, after] = await heard(page);
  return Math.abs(after.from - before.to);
};

// MPEG-1 Layer III frames of silence: 32kbps, 32kHz, mono, 36ms each.
const silentMp3 = (milliseconds) => {
  const frame = Buffer.alloc(144);
  frame.set([0xff, 0xfb, 0x18, 0xc0]);
  return Buffer.concat(Array.from({ length: Math.ceil(milliseconds / 36) }, () => frame));
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
