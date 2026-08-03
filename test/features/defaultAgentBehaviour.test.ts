import { test, expect } from "@playwright/test";

// The agent's interaction rules, which no screenshot can show: a locked agent
// still takes the question and answers with the publisher's offer, and the
// shortcuts list is the publisher's questions rather than invented commands.
test("default player agent behaviour", async ({ page }) => {
  await page.goto("http://localhost:8000");
  await waitForStylesToLoad(page);

  const shortcuts = ["What are today's headlines?", "Catch me up on this story", "What's new in my topics?"];
  const cta = { agentCtaText: "Subscribe to ask questions", agentCtaUrl: "https://example.com/agent" };

  // Both surfaces behave the same: the bar's panel and the agent-only embed.
  for (const embedMode of ["agent", "audio-agent"]) {
    await openPanel(page, { embedMode, agentAccess: "locked", shortcuts, ...cta });

    expect(await panelState(page), `${embedMode}: a locked agent still invites a question`).toEqual({
      chips: shortcuts,
      canType: true,
      thread: [],
      ctaHref: null,
    });

    await page.locator(".default-player .empty-chips button").first().click();
    await page.waitForTimeout(350);

    expect(await panelState(page), `${embedMode}: and answers it with the publisher's offer`).toEqual({
      chips: [],
      canType: false,
      thread: ["What are today's headlines?", "Subscribe to ask questions"],
      ctaHref: "https://example.com/agent",
    });

    // Typing gets there too, not just the chips.
    await openPanel(page, { embedMode, agentAccess: "locked", shortcuts, ...cta });

    const input = page.locator(".default-player .composer input").first();
    await input.click();
    await input.type("Who is involved?");
    await input.press("Enter");
    await page.waitForTimeout(350);

    const typed = await panelState(page);
    expect(typed.thread[0], `${embedMode}: the question they typed is kept`).toEqual("Who is involved?");
    expect(typed.ctaHref, `${embedMode}: with the same offer`).toEqual("https://example.com/agent");
    expect(typed.canType, `${embedMode}: and the composer closes behind it`).toEqual(false);

    // An unlocked agent is unaffected.
    await openPanel(page, { embedMode, agentAccess: "full", shortcuts, ...cta });
    await page.locator(".default-player .empty-chips button").first().click();
    await page.waitForTimeout(400);

    const answered = await panelState(page);
    expect(answered.canType, `${embedMode}: full access keeps its composer`).toEqual(true);
    expect(answered.thread[1], `${embedMode}: and gets a real answer`).not.toEqual("Subscribe to ask questions");
  }

  // Whose words the offer uses: the agent's own, or the article's, or none.
  await openPanel(page, { embedMode: "audio-agent", agentAccess: "locked", shortcuts, accessCtaText: "Subscribe to keep listening", accessCtaUrl: "https://example.com/subscribe" });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForTimeout(350);

  expect(await panelState(page), "with no agent CTA it inherits the article's").toEqual({
    chips: [],
    canType: false,
    thread: ["What are today's headlines?", "Subscribe to keep listening"],
    ctaHref: "https://example.com/subscribe",
  });

  await openPanel(page, { embedMode: "audio-agent", agentAccess: "locked", shortcuts, accessCtaText: "Subscribe to keep listening", accessCtaUrl: "https://example.com/subscribe", ...cta });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForTimeout(350);

  expect((await panelState(page)).ctaHref, "the agent's own CTA wins").toEqual("https://example.com/agent");

  // With nothing configured the answer is the lock alone: no invented copy and
  // no link that goes nowhere.
  await openPanel(page, { embedMode: "audio-agent", agentAccess: "locked", shortcuts });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForTimeout(350);

  const bare = await panelState(page);
  expect(bare.thread[0]).toEqual("What are today's headlines?");
  expect(bare.thread[1]).toEqual("");
  expect(bare.ctaHref).toEqual(null);
  expect(bare.canType).toEqual(false);

  // Shortcuts: pressing / lists the publisher's questions and typing narrows
  // them. No slugs, so nothing to collide and nothing to translate.
  await openPanel(page, { embedMode: "agent", agentAccess: "full", shortcuts });

  const input = page.locator(".default-player .composer input").first();
  await input.click();
  await input.press("/");
  await page.waitForTimeout(200);

  expect(await shortcutRows(page), "the whole list, as written").toEqual(shortcuts);

  await input.type("catch");
  await page.waitForTimeout(200);

  expect(await shortcutRows(page), "narrowed by what was typed").toEqual(["Catch me up on this story"]);

  await input.press("Enter");
  await page.waitForTimeout(350);

  expect((await panelState(page)).thread[0], "Enter takes the question, not the search").toEqual("Catch me up on this story");

  // A search that matches nothing gets out of the way.
  await input.press("/");
  await input.type("zzz");
  await page.waitForTimeout(200);

  expect(await page.locator(".default-player .shortcuts").count()).toEqual(0);

  // The answer is revealed as it arrives, not animated from a string the panel
  // already has: dots while the agent composes, then the text behind a caret.
  // Kept last, since it is the one case that needs animation left on.
  await page.evaluate(() => { window.disableAnimation = false; });
  await openPanel(page, { embedMode: "agent", agentAccess: "full", shortcuts });
  await page.locator(".default-player .empty-chips button").first().click();

  await page.waitForSelector(".default-player .typing", { timeout: 2000 });
  expect(await answerLength(page), "nothing is written while it composes").toEqual(0);

  await page.waitForSelector(".default-player .cursor", { timeout: 3000 });
  const midway = await answerLength(page);

  await page.waitForFunction(() => !document.querySelector(".default-player .cursor"), null, { timeout: 15000 });
  const finished = await answerLength(page);

  expect(midway, "the first deltas are on screen before the last").toBeGreaterThan(0);
  expect(finished, "and it keeps filling in").toBeGreaterThan(midway);
  expect(await page.locator(".default-player .typing").count(), "the dots give way to the answer").toEqual(0);

  // Every animation in the player is a keyframe animation, and StyleReset's
  // all: initial is !important, which beats one. So each animated element has to
  // carry the class that exempts it, or the motion is silently dead - which is
  // how the orb spent weeks not breathing while its CSS said 3.4s.
  expect(await moves(page, ".default-player .orb", "transform"), "the orb breathes").toBeGreaterThan(1);

  // The caret has to be sampled while an answer is still arriving.
  await openPanel(page, { embedMode: "agent", agentAccess: "full", shortcuts });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForSelector(".default-player .cursor", { timeout: 3000 });

  expect(await moves(page, ".default-player .cursor", "opacity"), "the caret blinks").toBeGreaterThan(1);

  // And holds still when the reader asked for that.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPanel(page, { embedMode: "agent", agentAccess: "full", shortcuts });

  expect(await moves(page, ".default-player .orb", "transform"), "reduced motion holds it").toEqual(1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

// How many distinct values a property takes over ~1s: 1 means it is not moving.
const moves = async (page, selector, property) => await page.evaluate(async ([selector, property]) => {
  const element = document.querySelector(selector);
  if (!element) { return 0; }

  const seen = new Set();

  for (let i = 0; i < 6; i++) {
    seen.add(getComputedStyle(element)[property]);
    await new Promise((resolve) => setTimeout(resolve, 160));
  }

  return seen.size;
}, [selector, property]);

const answerLength = async (page) => await page.evaluate(() => {
  const answer = [...document.querySelectorAll(".default-player .thread > div")].at(-1);
  return (answer?.querySelector(".answer-col")?.textContent || "").trim().length;
});

// Mounts the player and opens the chat panel, whichever surface holds it.
const openPanel = async (page, params) => {
  await page.evaluate(async (params) => {
    const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 60 }];

    BeyondWords.Player.destroyAll();
    const player = new BeyondWords.Player({ target: ".beyondwords-player" });

    Object.assign(player, {
      playerStyle: "default",
      content: [{ title: "An article", audio }],
      ...params,
    });

    await new Promise((resolve) => setTimeout(resolve, 400));
  }, params);

  // The agent-only embed is the panel; the bar has to be asked for it.
  const button = page.locator(".default-player .chat-button");
  if (await button.count()) {
    await button.click();
    await page.waitForTimeout(350);
  }
};

const panelState = async (page) => await page.evaluate(() => {
  const root = document.querySelector(".default-player");

  return {
    chips: [...root.querySelectorAll(".empty-chips button")].map((chip) => chip.textContent.trim()),
    canType: !!root.querySelector(".composer:not(.spent) input"),
    thread: [...root.querySelectorAll(".thread > div")].map((row) => row.textContent.trim()),
    ctaHref: root.querySelector(".thread .locked-answer a, .composer.spent a")?.getAttribute("href") || null,
  };
});

const shortcutRows = async (page) => await page.evaluate(() => (
  [...document.querySelectorAll(".default-player .shortcuts .shortcut-row")].map((row) => row.textContent.trim())
));

const waitForStylesToLoad = async (page) => {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      setInterval(() => BeyondWords.Player._styleLoaded && resolve(), 100);
      window.disableAnimation = true;
      window.disableMediaLoad = true;
    });
  });
};
