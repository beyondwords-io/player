import { test, expect } from "@playwright/test";

// A tier's segment_limit is enforced on every media tick, so the only way to
// know it still holds - and that it no longer stops a summary dead - is to play
// the ticks. Media cannot load in CI, so the time updates are driven by hand.
test("default player access tier behaviour", async ({ page }) => {
  await page.goto("http://localhost:8000");

  await waitForStylesToLoad(page);

  // The article, then the summary, whose timeline starts again at zero: the
  // shape the /player endpoint returns.
  const segments = [
    { section: "title", marker: "t", startTime: 0, duration: 5 },
    { section: "body", marker: "b1", startTime: 5, duration: 20 },
    { section: "body", marker: "b2", startTime: 25, duration: 19 },
    { section: "body", marker: "b3", startTime: 44, duration: 21 },
    { section: "summary", marker: "s1", startTime: 0, duration: 6.5 },
    { section: "summary", marker: "s2", startTime: 6.5, duration: 13 },
    { section: "summary", marker: "s3", startTime: 19.5, duration: 11 },
  ];

  // Anonymous readers of this project get two segments.
  const previewOfTheArticle = await playThrough(page, { segments, summary: false, segmentLimit: 2, times: [1, 6, 26] });

  expect(previewOfTheArticle.stoppedAt, "the article stops at its limit").toEqual(26);
  expect(previewOfTheArticle.reachedLimit).toEqual(true);

  const wholeSummary = await playThrough(page, { segments, summary: true, segmentLimit: 2, times: [1, 7, 20, 29] });

  expect(wholeSummary.reachedLimit, "the summary is not truncated by the article's limit").toEqual(false);
  expect(wholeSummary.stoppedAt, "the summary keeps playing").toEqual(null);
  expect(wholeSummary.playbackState).toEqual("playing");

  // A title-only tier locks the article but still lets the summary run, which is
  // the paywall the summary exists for.
  const titleOnly = await playThrough(page, { segments, summary: false, segmentLimit: 0, times: [1] });
  const summaryUnderTitleOnly = await playThrough(page, { segments, summary: true, segmentLimit: 0, times: [1, 20] });

  expect(titleOnly.reachedLimit, "the article is locked to its title").toEqual(true);
  expect(summaryUnderTitleOnly.reachedLimit, "the summary still plays").toEqual(false);

  // With no tier, the article plays to the end.
  const fullAccess = await playThrough(page, { segments, summary: false, segmentLimit: undefined, times: [1, 26, 50] });
  expect(fullAccess.reachedLimit).toEqual(false);

  // The limit stops playback and rewinds to zero, so the bar cannot read the
  // preview-ended state off the time: it has to hear the event. The label is the
  // publisher's own CTA text, so nothing here needs translating.
  expect(previewOfTheArticle.barAfterwards, "a spent preview offers the upgrade").toEqual({
    label: "Subscribe to keep listening",
    isLink: true,
    locked: true,
  });

  expect(titleOnly.barAfterwards, "a title-only tier offers it from the start").toEqual({
    label: "Subscribe to keep listening",
    isLink: true,
    locked: true,
  });

  expect(wholeSummary.barAfterwards.locked, "the summary is not sold back to the reader").toEqual(false);
  expect(fullAccess.barAfterwards.locked, "full access is not locked").toEqual(false);

  // With no CTA text from the publisher, the bar keeps its translated title
  // rather than inventing English.
  const withoutCtaText = await playThrough(page, { segments, summary: false, segmentLimit: 0, times: [1], accessCtaText: undefined });
  expect(withoutCtaText.barAfterwards.label).toEqual("Listen to this article");

  // The agent is sold with its own words, or with the article's, or not at all -
  // but never with a sentence the player made up pointing at a dead link.
  const locked = (params) => lockedAgent(page, params);

  expect(await locked({}), "inherits the article's CTA").toEqual({
    label: "Subscribe to keep listening",
    pitch: "Subscribe to keep listening",
    href: "https://example.com/subscribe",
    opens: true,
  });

  expect(await locked({ agentCtaText: "Upgrade to ask questions", agentCtaUrl: "https://example.com/agent" }), "its own CTA wins").toEqual({
    label: "Upgrade to ask questions",
    pitch: "Upgrade to ask questions",
    href: "https://example.com/agent",
    opens: true,
  });

  expect(await locked({ accessCtaText: undefined, accessCtaUrl: undefined }), "no copy, no pitch and no dead link").toEqual({
    label: "Chat about this article",
    pitch: null,
    href: null,
    opens: false,
  });

  // An agent-only embed has no bar to fall back to, so a locked agent has to
  // replace the composer rather than leave one that cannot send anything.
  expect(await agentOnly(page, { agentAccess: "locked" }), "locked leaves nothing to type into").toEqual({
    composer: false,
    pitch: "Subscribe to keep listening",
    href: "https://example.com/subscribe",
  });

  expect(await agentOnly(page, { agentAccess: "full" }), "full access can be used").toEqual({
    composer: true,
    pitch: null,
    href: null,
  });

  // Offering one version selects it, rather than silently playing the other.
  const chosen = await page.evaluate(async () => {
    BeyondWords.Player.destroyAll();
    const player = new BeyondWords.Player({ target: ".beyondwords-player", playerStyle: "default", versions: ["summary"] });
    await new Promise((resolve) => setTimeout(resolve, 200));

    return { summary: player.summary, versions: player.versions };
  });

  expect(chosen, "versions: [summary] plays the summary").toEqual({ summary: true, versions: ["summary"] });
});

// Loads content, plays, and reports whether the segment limit cut it off.
const playThrough = async (page, params) => await page.evaluate(async (params) => {
  const { segments, summary, segmentLimit, times, accessCtaText } = params;
  const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 60 }];

  BeyondWords.Player.destroyAll();
  const player = new BeyondWords.Player({ target: ".beyondwords-player" });

  let reachedLimit = false;
  let stoppedAt = null;

  player.addEventListener("SegmentLimitReached", () => reachedLimit = true);

  Object.assign(player, {
    playerStyle: "default",
    content: [{ title: "An article", audio, summarization: { audio, video: [] }, segments }],
    summary,
    segmentLimit,
    accessCtaUrl: "https://example.com/subscribe",
    accessCtaText: "accessCtaText" in params ? accessCtaText : "Subscribe to keep listening",
    duration: summary ? 30 : 60,
    playbackState: "playing",
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  const media = document.querySelector(".beyondwords-player audio, .beyondwords-player video");

  for (const time of times) {
    if (player.playbackState !== "playing") { break; }

    player.currentTime = time;
    await new Promise((resolve) => setTimeout(resolve, 60));

    media?.dispatchEvent(new Event("timeupdate"));
    await new Promise((resolve) => setTimeout(resolve, 120));

    if (player.playbackState !== "playing" && stoppedAt === null) { stoppedAt = time; }
  }

  const bar = document.querySelector(".default-player");

  return {
    reachedLimit,
    stoppedAt,
    playbackState: player.playbackState,
    currentSegment: player.currentSegment?.marker || null,
    barAfterwards: {
      label: bar?.querySelector(".title")?.textContent.trim() || null,
      isLink: !!bar?.querySelector(".title.tier-cta"),
      locked: !!bar?.querySelector(".tier-lock"),
    },
  };
}, params);

// The agent-only embed: is there anything to type into?
const agentOnly = async (page, params) => await page.evaluate(async (params) => {
  const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 60 }];

  BeyondWords.Player.destroyAll();
  const player = new BeyondWords.Player({ target: ".beyondwords-player" });

  Object.assign(player, {
    playerStyle: "default", embedMode: "agent",
    content: [{ title: "An article", audio }],
    accessCtaText: "Subscribe to keep listening",
    accessCtaUrl: "https://example.com/subscribe",
    ...params,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
  const root = document.querySelector(".default-player");

  return {
    composer: !!root.querySelector(".composer"),
    pitch: root.querySelector(".locked-pitch")?.textContent.trim() || null,
    href: root.querySelector(".locked-pitch a")?.getAttribute("href") || null,
  };
}, params);

// Opens the locked chat button and reports what it offers.
const lockedAgent = async (page, params) => await page.evaluate(async (params) => {
  const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 60 }];

  BeyondWords.Player.destroyAll();
  const player = new BeyondWords.Player({ target: ".beyondwords-player" });

  Object.assign(player, {
    playerStyle: "default", embedMode: "audio-agent", agentAccess: "locked",
    content: [{ title: "An article", audio }],
    accessCtaText: "Subscribe to keep listening",
    accessCtaUrl: "https://example.com/subscribe",
    ...params,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  const button = document.querySelector(".default-player .chat-button");
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 300));

  const pitch = document.querySelector(".default-player .locked-pitch");
  const link = pitch?.querySelector("a");

  return {
    label: button.getAttribute("aria-label"),
    pitch: pitch?.textContent.trim() || null,
    href: link?.getAttribute("href") || null,
    opens: !!pitch,
  };
}, params);

const waitForStylesToLoad = async (page) => {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      setInterval(() => BeyondWords.Player._styleLoaded && resolve(), 100);
      window.disableAnimation = true;
      window.disableMediaLoad = true;
    });
  });
};
