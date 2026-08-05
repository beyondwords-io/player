import { test, expect } from "@playwright/test";

const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 60 }];
const video = [{ id: 2, url: "http://example.com/a.mp4", contentType: "video/mp4", duration: 60, videoSize: { width: 1280, height: 720 } }];

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:8000");
  await waitForStylesToLoad(page);

  await page.evaluate(() => {
    window.disableAnimation = true;
    window.disableMediaLoad = true;
    BeyondWords.Player.destroyAll();
  });
});

test("default player cross-surface agent behaviour", async ({ page }) => {
  await page.evaluate((audio) => {
    const widget = document.createElement("div");
    widget.id = "agent-widget";
    document.body.appendChild(widget);

    new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      widgetStyle: "default",
      widgetTarget: "#agent-widget",
      embedMode: "audio-agent",
      playbackState: "playing",
      content: [{ title: "Article", audio }],
    });
  }, audio);

  const inline = page.locator(".beyondwords-player .default-player");
  const widget = page.locator("#agent-widget .default-player");

  await inline.locator(".chat-button").click();
  await inline.locator("input").fill("What happened?");
  await inline.locator("button[aria-label='Send']").click();
  await expect(inline.locator(".reader-row")).toHaveCount(1);

  await widget.locator(".chat-button").click();
  await expect(widget.locator(".reader-row")).toHaveCount(1);
  await expect(widget.locator(".reader-row")).toContainText("What happened?");

  // Start afresh for a voice call: article audio pauses when the call begins,
  // cannot be restarted underneath it, and resumes when the call ends.
  await page.evaluate((audio) => {
    BeyondWords.Player.destroyAll();
    document.querySelector("#agent-widget")?.remove();

    new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      embedMode: "audio-agent",
      playbackState: "playing",
      content: [{ title: "Article", audio }],
    });
  }, audio);

  // Scope to the inline player: the page is still scrolled to the bottom from
  // the widget interactions above, so the fresh player is out of view and can
  // elect its own bottom widget - a second .default-player - at any moment.
  const player = page.locator(".beyondwords-player .default-player");
  await player.locator(".chat-button").click();
  await player.locator(".voice").click();
  await expect(player.locator(".strip-label")).toContainText("Listening");
  await expect.poll(() => playback(page)).toBe("paused");

  await player.locator(".play-pause").click();
  await page.waitForTimeout(100);
  expect(await playback(page), "article playback stays paused during the call").toEqual("paused");
  await expect(player.locator(".strip-label")).toContainText("Listening");

  await player.locator(".pill", { hasText: "End" }).click();
  await expect.poll(() => playback(page)).toBe("playing");
});

test("default player mixed-media playlist behaviour", async ({ page }) => {
  await page.evaluate(({ audio, video }) => {
    const widget = document.createElement("div");
    widget.id = "video-widget";
    document.body.appendChild(widget);

    new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      widgetStyle: "default",
      widgetTarget: "#video-widget",
      video: true,
      embedMode: "audio",
      content: [
        { title: "Audio only", audio, video: [], summarization: { audio, video } },
        { title: "Has video", audio, video },
      ],
    });
  }, { audio, video });

  const widget = page.locator("#video-widget .default-player");
  await expect(widget.locator(".video-frame")).toHaveCount(0);
  await expect(widget.locator(".bar")).toHaveCount(1);

  await page.evaluate(() => BeyondWords.Player.instances()[0].summary = true);
  await expect(widget.locator(".video-frame")).toHaveCount(1);
});

test("media preference changes do not replace sources after playback starts", async ({ page }) => {
  const sources = await page.evaluate(async ({ audio, video }) => {
    window.disableMediaLoad = false;

    const player = new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      video: false,
      currentTime: 10,
      playbackState: "paused",
      content: [{ title: "Article", audio, video }],
    });

    const sourceUrls = () => Array.from(document.querySelectorAll(".media-element source"), source => source.getAttribute("src"));

    await new Promise(resolve => setTimeout(resolve, 100));
    const before = sourceUrls();
    player.video = true;
    await new Promise(resolve => setTimeout(resolve, 100));

    return { before, after: sourceUrls() };
  }, { audio, video });

  expect(sources.before).toHaveLength(1);
  expect(sources.before[0]).toContain("a.mp3");
  expect(sources.after).toEqual(sources.before);
});

test("inline video elects its widget after it is scrolled out of view", async ({ page }) => {
  await page.evaluate(({ audio, video }) => {
    window.scrollTo(0, 0);

    const player = new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      widgetStyle: "default",
      video: true,
      content: [{ title: "Article", audio, video }],
    });

    Object.assign(player, {
      loadedMedia: { ...video[0], format: "video" },
      playbackState: "playing",
      currentTime: 10,
      duration: 60,
    });
  }, { audio, video });

  await expect(page.locator(".beyondwords-player .default-player:not(.fixed) .video-frame")).toHaveCount(1);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator(".default-player.fixed .video-frame")).toHaveCount(1);

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator(".default-player.fixed")).toHaveCount(0);
});

test("default bar folds Chat using the rendered label width", async ({ page }) => {
  await page.evaluate((audio) => {
    const target = document.querySelector(".beyondwords-player");
    target.style.width = "320px";
    target.style.maxWidth = "none";

    new BeyondWords.Player({
      target,
      playerStyle: "default",
      embedMode: "audio-agent",
      playbackState: "stopped",
      content: [{ title: "Article", audio }],
    });
  }, audio);

  const renderedChatLabel = page.locator(".default-player .bar .chat-label");
  await expect(renderedChatLabel).toHaveCount(1);

  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = ".chat-width-sizer .chat-label { font-size: 80px !important; }";
    document.head.appendChild(style);
  });

  await expect(renderedChatLabel).toHaveCount(0);
});

test("default player API video alias behaviour", async ({ page }) => {
  await page.route("https://api.beyondwords.io/**", async (route) => {
    const playerStyle = route.request().url().includes("c-default") ? "default" : "standard";

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        language: "en",
        content: [{
          id: "content",
          title: "Article",
          audio: [{ id: 1, url: "https://example.com/a.mp3", content_type: "audio/mpeg", duration: 60000 }],
          video: [],
          segments: [],
        }],
        settings: {
          theme: "light",
          player_style: playerStyle,
          light_theme: {},
          video_theme: {},
          intros_outros: [],
        },
        video_settings: {},
      }),
    });
  });

  const state = await page.evaluate(async () => {
    const load = async (contentId) => {
      const player = new BeyondWords.Player({
        target: ".beyondwords-player",
        projectId: 7,
        contentId,
        video: true,
      });

      for (let i = 0; i < 100 && player.content.length === 0; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      const result = {
        playerStyle: player.playerStyle,
        video: player.video,
        initialPlayerStyle: player.initialProps.playerStyle,
        apiPlayerStyle: player.apiProps?.playerStyle,
      };

      player.destroy();
      return result;
    };

    return {
      defaultStyle: await load("c-default"),
      legacyStyle: await load("c-standard"),
    };
  });

  expect(state).toEqual({
    defaultStyle: {
      playerStyle: "default",
      video: true,
      initialPlayerStyle: undefined,
      apiPlayerStyle: "default",
    },
    legacyStyle: {
      playerStyle: "video",
      video: true,
      initialPlayerStyle: undefined,
      apiPlayerStyle: "standard",
    },
  });
});

const playback = async (page) => page.evaluate(() => BeyondWords.Player.instances()[0].playbackState);

const waitForStylesToLoad = async (page) => {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      setInterval(() => BeyondWords.Player._styleLoaded && resolve(), 100);
    });
  });
};
