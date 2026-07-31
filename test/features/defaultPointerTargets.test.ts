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
  const singleItem = [{ title: "A reasonable length podcast title", audio }];
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
