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
  // elect its own bottom widget - a second .default-player, rendered inside
  // the same target - at any moment.
  const player = page.locator(".beyondwords-player .default-player:not(.fixed)");
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

test("default player playlist rows stay inside the player surface", async ({ page }) => {
  await page.evaluate((audio) => {
    new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      widgetStyle: "none",
      playlistStyle: "show",
      content: [
        { title: "First item", audio },
        { title: "Second item", audio },
        { title: "Third item", audio },
      ],
    });
  }, audio);

  const surface = await page.locator(".default-player .surface").boundingBox();
  const rows = page.locator(".default-player .queue .row");
  const rowCount = await rows.count();

  expect(rowCount).toEqual(3);
  await expect(rows.locator(".index")).toHaveCount(0);
  await expect(rows.locator(".play-glyph")).toHaveCount(2);
  await expect(rows.locator(".play-glyph").first()).toBeVisible();
  for (let index = 0; index < rowCount; index += 1) {
    const box = await rows.nth(index).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(surface.x);
    expect(box.x + box.width).toBeLessThanOrEqual(surface.x + surface.width);
  }
});

test("default player runtime theme behaviour uses literal palettes and live Auto", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate((audio) => {
    new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      widgetStyle: "none",
      theme: "auto",
      lightTheme: { backgroundColor: "rgb(241, 242, 243)", textColor: "#111" },
      darkTheme: { backgroundColor: "rgb(31, 32, 33)", textColor: "#eee" },
      content: [{ title: "Article", audio }],
    });
  }, audio);

  const surface = page.locator(".default-player .surface");
  await expect(surface).toHaveCSS("background-color", "rgb(241, 242, 243)");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(surface).toHaveCSS("background-color", "rgb(31, 32, 33)");

  await page.evaluate(() => BeyondWords.Player.instances()[0].theme = "light");
  await expect(surface).toHaveCSS("background-color", "rgb(241, 242, 243)");

  await page.evaluate(() => {
    const player = BeyondWords.Player.instances()[0];
    player.theme = undefined;
    player.projectTheme = "dark";
    player.darkTheme.backgroundColor = "rgb(41, 42, 43)";
  });
  await expect(surface).toHaveCSS("background-color", "rgb(41, 42, 43)");
});

test("default player tier lock uses the icon palette role", async ({ page }) => {
  await page.evaluate((audio) => {
    new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      widgetStyle: "none",
      segmentLimit: 0,
      lightTheme: {
        iconColor: "rgb(0, 128, 0)",
        secondaryTextColor: "rgb(255, 165, 0)",
      },
      content: [{ title: "Article", audio }],
    });
  }, audio);

  const lockPaths = page.locator(".default-player .tier-lock path");
  await expect(lockPaths).toHaveCount(2);
  await expect(lockPaths.first()).toHaveAttribute("stroke", "rgb(0, 128, 0)");
});

test("default player progress and status icons use the icon palette role", async ({ page }) => {
  await page.evaluate((audio) => {
    new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      widgetStyle: "none",
      embedMode: "audio-agent",
      playbackState: "playing",
      currentTime: 30,
      duration: 60,
      agentQuestionsLimit: 0,
      agentQuestionsRemaining: 0,
      agentVoice: false,
      agentVoiceSecondsLimit: 0,
      agentVoiceSecondsRemaining: 0,
      lightTheme: {
        textColor: "rgb(200, 0, 0)",
        secondaryTextColor: "rgb(255, 165, 0)",
        iconColor: "rgb(0, 128, 0)",
      },
      content: [{ title: "Article", audio }],
    });
  }, audio);

  const player = page.locator(".default-player");
  await expect(player.locator(".progress-track .fill")).toHaveCSS("background-color", "rgb(0, 128, 0)");
  await expect(player.locator(".chat-button > svg path").first()).toHaveAttribute("stroke", "rgb(0, 128, 0)");

  await player.locator(".chat-button").click();
  await player.locator("input").fill("What happened?");
  await player.locator("button[aria-label='Send']").click();
  await expect(player.locator(".locked-answer svg path").first()).toHaveAttribute("stroke", "rgb(0, 128, 0)");
  await expect(player.locator(".composer.spent > svg path").first()).toHaveAttribute("stroke", "rgb(0, 128, 0)");

  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(player.locator(".offline-note svg path").first()).toHaveAttribute("stroke", "rgb(0, 128, 0)");
  await expect(player.locator(".progress-track .fill")).toHaveCSS("background-color", "rgb(0, 128, 0)");
});

test("default player video progress uses the video icon palette role", async ({ page }) => {
  await page.evaluate(({ audio, video }) => {
    const player = new BeyondWords.Player({
      target: ".beyondwords-player",
      playerStyle: "default",
      widgetStyle: "none",
      video: true,
      videoTheme: {
        textColor: "rgb(200, 0, 0)",
        iconColor: "rgb(0, 128, 0)",
      },
      content: [{ title: "Video", audio, video }],
    });

    Object.assign(player, {
      loadedMedia: { ...video[0], format: "video" },
      playbackState: "paused",
      currentTime: 30,
      duration: 60,
    });
  }, { audio, video });

  const frame = page.locator(".default-player .video-frame");
  await expect(frame.locator(".title")).toHaveCSS("color", "rgb(200, 0, 0)");
  await expect(frame.locator(".progress-track .fill")).toHaveCSS("background-color", "rgb(0, 128, 0)");
  await expect(frame.locator(".progress-track")).toHaveCSS("outline-color", "rgb(0, 128, 0)");
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
    // Inline + important: a stylesheet cannot outrank the player's own CSS,
    // which is all !important behind the .bwp prefix chain.
    const sizerLabel = document.querySelector(".chat-width-sizer .chat-label");
    sizerLabel.style.setProperty("font-size", "80px", "important");
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
