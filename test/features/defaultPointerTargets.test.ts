import { test, expect } from "@playwright/test";

// A control can be perfectly rendered, perfectly labelled, and still not be
// clickable, because something invisible is on top of it. Screenshots cannot see
// that and axe does not look for it: the .icon-button touch floor once resolved
// against the whole bar and swallowed every click on it, including pause.
//
// So for every control, ask the browser what it would actually hit.
//
// The title says accessibility on purpose: that is what ./bin/test_accessibility
// and the CI step grep for, and target size and operability are what this checks.
test("default player pointer target accessibility", async ({ page }) => {
  await page.goto("http://localhost:8000");

  await waitForStylesToLoad(page);
  await resetPlayerProps(page);

  const audio = [{ id: 123, url: "http://example.com/audio.mp3", contentType: "audio/mpeg", duration: 30 }];

  // The summary variant is what puts the version menu in the bar.
  const singleItem = [{ title: "A reasonable length podcast title", audio, summarization: { audio, video: [] } }];
  const playlistItems = [singleItem[0], { title: "Another playlist item", audio }, { title: "A third item", audio }];
  const advert = [{ clickThroughUrl: "https://example.com", audio }];

  const base = {
    playerStyle: "default",
    widgetStyle: "none",
    widgetPosition: null,
    embedMode: "audio-agent",
    theme: "light",
    radius: 8,
    agentAccess: "full",
    adverts: [],
    advertIndex: -1,
    duration: 30,
    currentTime: 10,
    contentIndex: 0,
    content: singleItem,
    playbackState: "playing",
  };

  // The states that put different controls in the bar, and the widths that fold
  // them into the overflow menu. Every control that appears is checked, so this
  // covers the transport, progress, skips, speed, queue, chat, menus and the
  // caption row without naming them.
  const states = [
    { name: "stopped", params: { ...base, playbackState: "stopped" } },
    { name: "playing", params: base },
    { name: "playing, audio only", params: { ...base, embedMode: "audio" } },
    { name: "playing a playlist", params: { ...base, content: playlistItems } },
    { name: "playing an advert", params: { ...base, adverts: advert, advertIndex: 0, duration: 15 } },
    { name: "playing, preview access", params: { ...base, segmentLimit: 2 } },
  ];

  for (const width of [512, 360]) {
    for (const { name, params } of states) {
      const problems = await surveyControls(page, params, width);

      expect(problems, `${name} at ${width}px`).toEqual([]);
      process.stdout.write(".");
    }
  }

  // And the whole point: the button labelled pause has to pause.
  await surveyControls(page, base, 512);

  const transport = await page.locator(".default-player button[aria-label='Pause audio']").boundingBox();
  await page.mouse.click(transport.x + transport.width / 2, transport.y + transport.height / 2);
  await page.waitForTimeout(200);

  expect(await page.evaluate(() => BeyondWords.Player.instances()[0].playbackState)).toEqual("paused");
  expect(await page.locator(".default-player .menu").count()).toEqual(0);

  // A menu has to be reachable, and dismissable from the control that opened it.
  // Docked at the bottom of the window it has to open upwards, or its items are
  // laid out past the edge of the screen where nothing can click them.
  for (const { name, params } of [
    { name: "inline", params: { ...base, playbackState: "stopped", versions: ["full", "summary"] } },
    { name: "bottom widget", params: { ...base, widgetStyle: "default", widgetPosition: "center", versions: ["full", "summary"] } },
  ]) {
    await surveyControls(page, params, 512);

    const trigger = await menuTrigger(page);
    expect(trigger, `${name} has a menu trigger`).toBeTruthy();

    await page.mouse.click(trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
    await page.waitForTimeout(250);

    expect(await menuProblems(page), `${name} menu items`).toEqual([]);

    await page.mouse.click(trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
    await page.waitForTimeout(250);

    expect(await page.locator(".default-player .menu").count(), `${name} menu closes from its trigger`).toEqual(0);
    process.stdout.write(".");
  }
});

// The video treatment has no bar: the same controls sit over the picture and
// fade out, and the picture itself is the play/pause target. So the overlay has
// to stop taking presses when it is invisible, and start again when it is not.
test("default player video pointer target accessibility", async ({ page }) => {
  await page.goto("http://localhost:8000");

  await waitForStylesToLoad(page);
  await resetPlayerProps(page);
  await showVideo(page);

  const frame = await page.locator(".default-player .video-frame").boundingBox();
  expect(Math.round(frame.height), "the frame holds the video's aspect ratio").toEqual(Math.round(frame.width * 9 / 16));

  // Invisible overlay: the picture takes the press, so the video plays.
  expect(await overlayState(page)).toEqual({ visible: false, hittable: [], pressAt85Percent: "frame-box" });

  // Hovering reveals it, and then every control has to work.
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
  await page.waitForTimeout(400);

  const revealed = await overlayState(page);
  expect(revealed.visible).toEqual(true);
  expect(revealed.hittable.length, "controls are clickable once revealed").toBeGreaterThan(2);
  expect(await surveyControls(page, {}, 512)).toEqual([]);

  const maximize = await page.locator(".default-player button[aria-label='Maximize video']").boundingBox();
  await page.mouse.click(maximize.x + maximize.width / 2, maximize.y + maximize.height / 2);
  await page.waitForTimeout(200);

  expect(await page.evaluate(() => window.__pressed), "a real click reaches the maximize button").toContain("PressedMaximize");

  // Fullscreen fills the screen, so the seek track has a width to drag.
  const fullscreen = await enterFullScreen(page);
  expect(fullscreen.frame, "the frame fills the fullscreen viewport").toEqual(fullscreen.viewport);
  expect(fullscreen.seekWidth, "the seek track has a width in fullscreen").toBeGreaterThan(fullscreen.viewport.width / 2);
  expect(fullscreen.controlsWithinFrame, "the controls sit over the picture").toEqual(true);
});

// The widget's geometry has three ways to go wrong that no screenshot covers:
// the sliding video is positioned by MediaElement while its frame is positioned
// by DefaultInterface, the margin string feeds CSS in two shapes, and a closing
// widget hangs around for its fade.
test("default player widget geometry accessibility", async ({ page }) => {
  await page.goto("http://localhost:8000");

  await waitForStylesToLoad(page);
  await resetPlayerProps(page);

  // The picture must sit exactly behind the frame that takes its presses.
  const geometry = await page.evaluate(async () => {
    const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 60 }];
    const video = [{ id: 2, url: "http://example.com/a.mp4", contentType: "video/mp4", duration: 60, videoSize: { name: "16:9", width: 1280, height: 720 } }];

    const player = BeyondWords.Player.instances()[0];
    Object.assign(player, {
      playerStyle: "default", video: true, embedMode: "audio", widgetStyle: "default", widgetPosition: "auto",
      showBottomWidget: true, content: [{ title: "A video", audio, video }],
      loadedMedia: { ...video[0], format: "video" },
      playbackState: "playing", duration: 60, currentTime: 5,
    });
    window.scrollTo(0, 99999);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const frame = document.querySelector(".default-player.fixed .frame-box").getBoundingClientRect();
    const media = document.querySelector(".media-element.behind-sliding-widget").getBoundingClientRect();
    const overlap = Math.max(0, Math.min(frame.right, media.right) - Math.max(frame.left, media.left))
      * Math.max(0, Math.min(frame.bottom, media.bottom) - Math.max(frame.top, media.top));

    return Math.round(100 * overlap / (frame.width * frame.height));
  });

  expect(geometry, "the sliding video sits behind its frame").toBeGreaterThanOrEqual(95);

  // Any margin string the manifest offers must still anchor the bar to the
  // bottom edge: a multi-part value used to void the bottom declaration and
  // leave the widget at its static position.
  for (const margin of ["16px", "32px 16px", "10px 20px 30px 40px"]) {
    const anchored = await page.evaluate(async (margin) => {
      const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 60 }];

      BeyondWords.Player.destroyAll();
      const player = new BeyondWords.Player({ target: ".beyondwords-player" });
      Object.assign(player, {
        playerStyle: "default", widgetStyle: "default", widgetPosition: "center", widgetMargin: margin,
        showBottomWidget: true, content: [{ title: "A", audio }], playbackState: "playing", duration: 60, currentTime: 5,
      });
      window.scrollTo(0, 99999);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const rect = document.querySelector(".default-player.fixed").getBoundingClientRect();
      return window.innerHeight - rect.bottom;
    }, margin);

    expect(anchored, `widgetMargin "${margin}" keeps the bar at the bottom edge`).toBeLessThanOrEqual(64);
    expect(anchored, `widgetMargin "${margin}" leaves the margin gap`).toBeGreaterThanOrEqual(0);
  }

  // A closing widget must take no presses while it fades out.
  const closing = await page.evaluate(async () => {
    const player = BeyondWords.Player.instances()[0];
    await new Promise((resolve) => setTimeout(resolve, 100));

    const widget = document.querySelector(".default-player.fixed");
    const pause = [...widget.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") || "").includes("Pause"));
    const r = pause.getBoundingClientRect();

    player.showBottomWidget = false;
    await new Promise((resolve) => setTimeout(resolve, 40));

    const hit = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2));
    const stillThere = document.querySelector(".default-player.fixed");

    return {
      fading: !!stillThere,
      hitsWidget: !!stillThere && stillThere.contains(hit),
    };
  });

  if (closing.fading) {
    expect(closing.hitsWidget, "a press during the fade goes to the page, not the dead widget").toEqual(false);
  }
});



const showVideo = async (page) => await page.evaluate(async () => {
  const player = BeyondWords.Player.instances()[0];
  const videoSize = { name: "16:9", width: 1280, height: 720 };
  const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 30 }];
  const video = [{ id: 2, url: "http://example.com/a.mp4", contentType: "video/mp4", duration: 30, videoSize }];

  window.__pressed = [];
  player.addEventListener("<any>", (event) => window.__pressed.push(event.type));

  Object.assign(player, {
    playerStyle: "default", video: true, widgetStyle: "none", widgetPosition: null, embedMode: "audio-agent",
    content: [{ title: "A video article", audio, video }],
    playbackState: "playing", duration: 30, currentTime: 10,
    // What the media element would report once a video source had loaded.
    loadedMedia: { id: 2, url: "http://example.com/a.mp4", contentType: "video/mp4", duration: 30, format: "video", videoSize },
  });

  await new Promise((resolve) => setTimeout(resolve, 400));
});

const overlayState = async (page) => await page.evaluate(() => {
  const frame = document.querySelector(".default-player .video-frame");
  const controls = frame.querySelector(".controls");

  const hittable = [...controls.querySelectorAll("button, [role='slider']")].filter((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) { return false; }

    const hit = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2));
    return hit === el || el.contains(hit);
  }).map((el) => el.getAttribute("aria-label"));

  // Pressing the picture is how playback toggles, so a press below the middle
  // has to reach the frame rather than the title or the time.
  const r = frame.getBoundingClientRect();
  const below = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height * 0.85));

  return {
    visible: controls.classList.contains("visible"),
    hittable,
    pressAt85Percent: (below?.className || "").toString().split(" ")[0],
  };
});

const enterFullScreen = async (page) => await page.evaluate(async () => {
  const player = BeyondWords.Player.instances()[0];

  // Headless cannot really go fullscreen, so apply what the browser's
  // :fullscreen rules would apply to the element. They are UA !important
  // declarations, which is why these have to be important too.
  player.target.setAttribute("style", [
    "position: fixed", "inset: 0", "margin: 0", "max-width: none",
    "width: 100%", "height: 100%", "z-index: 2147483647",
  ].map((declaration) => `${declaration} !important`).join("; "));

  player.target.classList.add("maximized");
  player.isFullScreen = true;

  await new Promise((resolve) => setTimeout(resolve, 400));

  const frame = document.querySelector(".default-player .video-frame").getBoundingClientRect();
  const controls = document.querySelector(".default-player .controls").getBoundingClientRect();
  const track = document.querySelector(".default-player .controls [role='slider']");

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    frame: { width: Math.round(frame.width), height: Math.round(frame.height) },
    seekWidth: track ? Math.round(track.getBoundingClientRect().width) : 0,
    controlsWithinFrame: controls.top >= frame.top && controls.bottom <= frame.bottom + 1,
  };
});

const menuTrigger = async (page) => await page.evaluate(() => {
  const root = document.querySelector(".default-player.fixed") || document.querySelector(".default-player");

  const trigger = [...root.querySelectorAll("button")].find((el) => (
    el.hasAttribute("aria-expanded") && !/chat/i.test(el.getAttribute("aria-label") || "")
  ));
  if (!trigger) { return null; }

  const r = trigger.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});

const menuProblems = async (page) => await page.evaluate(() => {
  const panel = document.querySelector(".default-player .menu");
  if (!panel) { return ["the menu did not open"]; }

  return [...panel.querySelectorAll("button")].flatMap((item) => {
    const r = item.getBoundingClientRect();
    const hit = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2));
    const label = item.textContent.trim().slice(0, 24);

    if (r.bottom > window.innerHeight || r.top < 0) { return [`${label} is laid out off the screen`]; }
    if (hit === item || item.contains(hit)) { return []; }

    return [`${label} is covered by ${hit ? `${hit.tagName}.${(hit.className || "").toString().slice(0, 20)}` : "nothing"}`];
  });
});

// Returns a description of every control the browser would not deliver a click
// to, plus any hit-area expander that grew beyond the control it belongs to.
const surveyControls = async (page, params, width) => {
  return await page.evaluate(async ([params, width]) => {
    const player = BeyondWords.Player.instances()[0];
    Object.entries(params).forEach(([key, value]) => player[key] = value);

    player.target.style.maxWidth = `${width}px`;
    await new Promise((resolve) => setTimeout(resolve, 250));

    const problems = [];
    const controls = [...document.querySelectorAll(".beyondwords-player button, .beyondwords-player [role='button'], .beyondwords-player [role='slider'], .beyondwords-player a[href]")];

    controls.forEach((control) => {
      const box = control.getBoundingClientRect();

      const offScreen = box.bottom < 0 || box.top > window.innerHeight || box.right < 0 || box.left > window.innerWidth;
      if (!box.width || !box.height || offScreen || control.checkVisibility?.() === false) { return; }

      const label = control.getAttribute("aria-label") || control.textContent.trim().slice(0, 24) || control.className.toString().slice(0, 24);

      // The centre and each corner, pulled in far enough to allow for rounding
      // and border radius.
      const points = [
        { at: "centre", x: box.x + box.width / 2, y: box.y + box.height / 2 },
        { at: "top left", x: box.x + 3, y: box.y + 3 },
        { at: "top right", x: box.right - 3, y: box.y + 3 },
        { at: "bottom left", x: box.x + 3, y: box.bottom - 3 },
        { at: "bottom right", x: box.right - 3, y: box.bottom - 3 },
      ];

      points.forEach(({ at, x, y }) => {
        const hit = document.elementFromPoint(Math.round(x), Math.round(y));
        if (hit === control || control.contains(hit)) { return; }

        const stealer = hit ? `${hit.tagName}[${hit.getAttribute?.("aria-label") || (hit.className || "").toString().slice(0, 24)}]` : "nothing";
        problems.push(`${label}: its ${at} is covered by ${stealer}`);
      });

      // An absolutely positioned ::before or ::after is how the touch floor is
      // added; it must resolve against the control, not an ancestor.
      ["::before", "::after"].forEach((pseudo) => {
        const style = getComputedStyle(control, pseudo);
        if (style.content === "none" || style.position !== "absolute") { return; }

        const grew = parseFloat(style.width) > box.width + 32 || parseFloat(style.height) > box.height + 32;
        if (grew) { problems.push(`${label}: its ${pseudo} is ${style.width} x ${style.height}, but the control is only ${Math.round(box.width)} x ${Math.round(box.height)}`); }
      });
    });

    return problems;
  }, [params, width]);
};

const waitForStylesToLoad = async (page) => {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      setInterval(() => BeyondWords.Player._styleLoaded && resolve(), 100);
      window.disableAnimation = true;
      window.disableMediaLoad = true;
    });
  });
};

const resetPlayerProps = async (page) => {
  await page.evaluate(async () => {
    BeyondWords.Player.destroyAll();
    new BeyondWords.Player({ target: ".beyondwords-player" });
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 500));
  });
};
