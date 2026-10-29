import { test, expect } from "@playwright/test";

// Content without media sources is skipped like zero-length content, so the
// intro, adverts and outro around it still play in order. The Player API is
// mocked and every clip is generated silence, so nothing touches the network.

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:8000");
  await waitForStylesToLoad(page);

  await page.evaluate(() => {
    window.disableAnimation = true;
    BeyondWords.Player.destroyAll();
  });
});

test("no media sources behaviour: intro, pre-roll, post-roll and outro still play", async ({ page }) => {
  await loadPlayer(page, { content: ["none"], intro: true, outro: true, ads: ["pre-roll", "post-roll"] });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "ad:pre-roll", "ad:post-roll", "outro"]);
});

test("no media sources behaviour: intro and outro still play without adverts", async ({ page }) => {
  await loadPlayer(page, { content: ["none"], intro: true, outro: true });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "outro"]);
});

test("no media sources behaviour: pressing play stops without painting the playing state", async ({ page }) => {
  await loadPlayer(page, { content: ["none"] });

  const framesBefore = await page.evaluate(() => window.paints.length);
  await pressPlay(page);
  await expect.poll(() => page.evaluate(() => window.events)).toContain("PressedPlay");

  // Frames painted after the click, past the delayed no-sources check.
  const paints = () => page.evaluate((i) => window.paints.slice(i), framesBefore);
  await expect.poll(async () => (await paints()).length).toBeGreaterThan(10);
  expect((await paints()).filter(f => f.state === "playing" || f.label === "Pause audio")).toEqual([]);
  expect(await state(page)).toEqual({ played: [], playbackState: "stopped" });
});

test("no media sources behaviour: a playlist skips the middle item", async ({ page }) => {
  await loadPlayer(page, { content: ["media", "none", "media"] });

  await pressPlay(page);
  await expectPlayed(page, ["content#0", "content#2"]);
});

test("no media sources behaviour: a playlist where no item has media plays the intro and outro", async ({ page }) => {
  await loadPlayer(page, { content: ["none", "none", "none"], intro: true, outro: true });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "outro"]);
});

test("no media sources behaviour: a custom UI setting playbackState plays the intro and outro", async ({ page }) => {
  // Without segments: a CurrentSegmentUpdated event would otherwise apply the intro.
  await loadPlayer(page, { content: ["none"], intro: true, outro: true, segments: false });

  // The integrator's own button sets the state directly, without a player event.
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.id = "custom-play";
    button.textContent = "Custom play";
    button.onclick = () => player.playbackState = "playing";
    document.body.prepend(button);
  });

  await page.locator("#custom-play").click();
  await expectPlayed(page, ["intro", "outro"]);
});

test("no media sources behaviour: replay after a post-roll plays only the content", async ({ page }) => {
  await loadPlayer(page, { content: ["media"], ads: ["pre-roll", "pre-roll", "post-roll"] });

  await pressPlay(page);
  await expectPlayed(page, ["ad:pre-roll", "content#0", "ad:post-roll"]);

  // The second pre-roll hasn't played, but it would follow the post-roll back-to-back.
  await pressPlay(page);
  await expectPlayed(page, ["content#0"]);
});

test("no media sources behaviour: replay starts with the intro again", async ({ page }) => {
  await loadPlayer(page, { content: ["media"], intro: true });

  await pressPlay(page);
  await expectPlayed(page, ["intro", "content#0"]);

  await pressPlay(page);
  await expectPlayed(page, ["intro", "content#0"]);
});

test("no media sources behaviour: skipping to an item without media stops the previous audio", async ({ page }) => {
  await loadPlayer(page, { content: ["long", "none"] });

  await pressPlay(page);
  await expect.poll(() => page.evaluate(() => window.played)).toEqual(["content#0"]);

  const eventsBefore = await page.evaluate(() => window.events.length);
  expect(await pressNextTrack(page)).toBe("playing");

  // The rest of the 3s clip mustn't keep playing (or restart) under the stopped player.
  await expect.poll(() => page.evaluate(() => [player.playbackState, video().paused]), { timeout: 1000 }).toEqual(["stopped", true]);
  const time = await page.evaluate(() => video().currentTime);
  await page.waitForTimeout(1000); // Previously the leftover audio errored and seeked in a loop.

  const events = await page.evaluate((i) => window.events.slice(i), eventsBefore);
  expect(events.filter(type => type === "MediaSeeked" || type === "PlaybackErrored").length).toBeLessThan(3);
  expect(await page.evaluate(() => [player.playbackState, video().paused, video().currentTime])).toEqual(["stopped", true, time]);
});

test("no media sources behaviour: skipping to an item without media keeps the playback rate", async ({ page }) => {
  await loadPlayer(page, { content: ["long", "none"] });

  await pressPlay(page);
  await expect.poll(() => page.evaluate(() => window.played)).toEqual(["content#0"]);

  await page.evaluate(() => player.playbackRate = 1.5);
  await expect.poll(() => page.evaluate(() => video().playbackRate)).toBe(1.5);
  expect(await pressNextTrack(page)).toBe("playing");

  await expect.poll(() => page.evaluate(() => player.playbackState)).toBe("stopped");
  expect(await page.evaluate(() => [player.playbackRate, video().playbackRate])).toEqual([1.5, 1.5]);
});

// Content is a list of "media", "long" (3s) or "none". Every clip has its own
// duration so that its URL is unique: played media is tracked by URL.
const loadPlayer = async (page, { content, intro = false, outro = false, ads = [], segments = true }) => {
  const labels = {};
  const audio = (label, duration = 400 + 20 * Object.keys(labels).length) => {
    const url = silentAudio(duration);
    labels[url] = label;
    return [{ id: Object.keys(labels).length, url, content_type: "audio/wav", duration }];
  };

  const response = {
    language: "en",
    settings: {
      player_style: "standard", theme: "light", embed_mode: "audio", variants: ["article"],
      analytics_enabled: false, outro_playback_mode: "after-all",
      intros_outros: [
        intro && { placement: "pre-roll", audio: audio("intro"), video: [] },
        outro && { placement: "post-roll", audio: audio("outro"), video: [] },
      ].filter(Boolean),
    },
    video_settings: { logo_image_position: "top-right" },
    ads: ads.map((placement, i) => ({
      id: i + 1, type: "custom", placement, audio: audio(`ad:${placement}`), video: [],
    })),
    content: content.map((kind, i) => ({
      id: `00000000-0000-4000-8000-00000000000${i}`, title: `Item ${i}`, ads_enabled: true,
      audio: kind === "none" ? [] : audio(`content#${i}`, kind === "long" ? 3000 + i : undefined),
      video: [], summarization: { audio: [], video: [] },
      segments: segments ? [
        { marker: `item-${i}-a`, section: "body", start_time: 0, duration: 200 },
        { marker: `item-${i}-b`, section: "body", start_time: 200, duration: 200 },
      ] : [],
    })),
  };

  await page.route(/api\.beyondwords\.io\/v1\/projects\/\d+\/player\//, route => route.fulfill({
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(response),
  }));

  await page.evaluate((labels) => {
    window.player = new BeyondWords.Player({
      target: ".beyondwords-player",
      widgetStyle: "none",
      projectId: 1,
      contentId: "00000000-0000-4000-8000-000000000000",
    });
    window.video = () => document.querySelector(".beyondwords-player video");

    window.events = [];
    player.addEventListener("<any>", e => window.events.push(e.type));

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

    // What the browser can paint: the state and the play button on every frame.
    window.paints = [];
    const sample = () => {
      const button = document.querySelector(".beyondwords-player .play-pause-button");
      window.paints.push({ state: player.playbackState, label: button?.getAttribute("aria-label") });
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, labels);

  await expect.poll(() => page.evaluate(() => player.content.length)).toBe(content.length);
};

const pressPlay = async (page) => {
  await page.evaluate(() => window.resetPlayed());
  await page.locator(".beyondwords-player .play-pause-button").first().click();
};

// Returns the state when pressed, so a clip that has already ended can't pass.
const pressNextTrack = (page) => page.evaluate(() => {
  const playbackState = video().paused ? "paused" : player.playbackState;

  player.onEvent({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    type: "PressedNextTrack",
    description: "The next track button was pressed.",
    initiatedBy: "user",
  });

  return playbackState;
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
