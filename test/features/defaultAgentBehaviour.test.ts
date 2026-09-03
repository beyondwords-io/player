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
    await openPanel(page, { embedMode, agentQuestionsLimit: 0, agentVoiceSecondsLimit: 0, shortcuts, ...cta });

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
    await openPanel(page, { embedMode, agentQuestionsLimit: 0, agentVoiceSecondsLimit: 0, shortcuts, ...cta });

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
    await openPanel(page, { embedMode, agentQuestionsLimit: null, agentVoiceSecondsLimit: null, shortcuts, ...cta });
    await page.locator(".default-player .empty-chips button").first().click();
    await page.waitForTimeout(400);

    const answered = await panelState(page);
    expect(answered.canType, `${embedMode}: full access keeps its composer`).toEqual(true);
    expect(answered.thread[1], `${embedMode}: and gets a real answer`).not.toEqual("Subscribe to ask questions");
  }

  // Text questions and voice seconds are independent allowances.
  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: 1, agentVoiceSecondsLimit: 0, agentVoice: true });
  expect(await page.locator(".default-player .voice").count(), "zero voice seconds hides voice").toEqual(0);

  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: 1, agentVoiceSecondsLimit: 60, agentVoice: true });
  expect(await page.locator(".default-player .voice").count(), "a question limit does not hide metered voice").toEqual(1);

  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: 0, agentVoiceSecondsLimit: 60, agentVoice: true });
  expect(await page.locator(".default-player .voice").count(), "voice remains when text is unavailable").toEqual(1);
  expect(await page.locator(".default-player .composer input").isDisabled(), "only the text input is disabled").toEqual(true);

  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: 1, agentVoiceSecondsLimit: 0, shortcuts, ...cta });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForTimeout(400);
  expect(await page.locator(".default-player .composer.spent").count(), "the shared question allowance is spent after one ask").toEqual(1);

  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: 0, agentVoiceSecondsLimit: 1, agentVoice: true, ...cta });
  await page.locator(".default-player .voice").click();
  await page.waitForFunction(() => document.querySelector(".default-player .strip")?.textContent?.includes("Listening"), null, { timeout: 3000 });
  await page.waitForSelector(".default-player .composer.spent", { timeout: 3000 });
  expect(await page.locator(".default-player .strip").count(), "spending the voice allowance ends the call").toEqual(0);

  // Whose words the offer uses: the agent's own, or the article's, or none.
  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: 0, agentVoiceSecondsLimit: 0, shortcuts, accessCtaText: "Subscribe to keep listening", accessCtaUrl: "https://example.com/subscribe" });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForTimeout(350);

  expect(await panelState(page), "with no agent CTA it inherits the article's").toEqual({
    chips: [],
    canType: false,
    thread: ["What are today's headlines?", "Subscribe to keep listening"],
    ctaHref: "https://example.com/subscribe",
  });

  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: 0, agentVoiceSecondsLimit: 0, shortcuts, accessCtaText: "Subscribe to keep listening", accessCtaUrl: "https://example.com/subscribe", ...cta });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForTimeout(350);

  expect((await panelState(page)).ctaHref, "the agent's own CTA wins").toEqual("https://example.com/agent");

  // With nothing configured the answer is the lock alone: no invented copy and
  // no link that goes nowhere.
  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: 0, agentVoiceSecondsLimit: 0, shortcuts });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForTimeout(350);

  const bare = await panelState(page);
  expect(bare.thread[0]).toEqual("What are today's headlines?");
  expect(bare.thread[1]).toEqual("");
  expect(bare.ctaHref).toEqual(null);
  expect(bare.canType).toEqual(false);

  // Shortcuts: pressing / lists the publisher's questions and typing narrows
  // them. No slugs, so nothing to collide and nothing to translate.
  await openPanel(page, { embedMode: "agent", agentQuestionsLimit: null, agentVoiceSecondsLimit: null, shortcuts });

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

  // Voice is a call, not dictation: a session starts on the first user act,
  // never on opening the panel; the two kinds are separate conversations; and
  // collapsing the panel neither hangs up nor loses the thread. Timers are
  // real here, so animation stays on and waits are generous.
  await page.evaluate(() => { window.disableAnimation = false; window.__agentSilenceTimeoutMs = undefined; });

  // Cancel abandons before anything starts: no session, no divider, no rows.
  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: null, agentVoiceSecondsLimit: null, shortcuts });
  await page.locator(".default-player .voice").click();

  await page.waitForSelector(".default-player .strip", { timeout: 2000 });
  expect(await stripText(page), "the composer becomes the call strip in place").toContain("Connecting");

  await page.locator(".default-player .pill", { hasText: "Cancel" }).click();
  await page.waitForTimeout(200);

  expect(await page.locator(".default-player .strip").count(), "Cancel returns the composer").toEqual(0);
  expect((await panelState(page)).thread, "and nothing is marked in the thread").toEqual([]);

  // The full loop: connect, listen, the utterance lands as a message (no
  // word-by-word transcript), the spoken reply can be interrupted by a tap,
  // and the call returns to listening with no button between turns.
  await page.locator(".default-player .voice").click();
  await page.waitForFunction(() => document.querySelector(".default-player .strip")?.textContent?.includes("Listening"), null, { timeout: 3000 });

  expect(await page.locator(".default-player .thread .partial").count(), "no partial transcript in the strip").toEqual(0);

  await page.waitForFunction(() => document.querySelector(".default-player .strip")?.textContent?.includes("Talking"), null, { timeout: 6000 });

  const midCall = await panelState(page);
  expect(midCall.thread[0], "the utterance lands whole").toEqual("What changed since last week's story?");

  await page.locator(".default-player .strip-interrupt").click();
  await page.waitForFunction(() => document.querySelector(".default-player .strip")?.textContent?.includes("Listening"), null, { timeout: 2000 });

  expect(await page.evaluate(() => !document.querySelector(".default-player .cursor")), "the tap interrupted the reply").toEqual(true);

  // Typing mid-call needs no mode: the composer sits under the call row, the
  // typed ask stays in the same conversation, and the waveform is gone - there
  // is no second conversation to start.
  expect(await page.locator(".default-player .composer input").count(), "the composer is there during the call").toEqual(1);
  expect(await page.locator(".default-player .voice").count(), "no waveform mid-call").toEqual(0);

  const callInput = page.locator(".default-player .composer input").first();
  await callInput.click();
  await callInput.type("Who is involved?");
  await callInput.press("Enter");

  await page.waitForFunction(() => (
    [...document.querySelectorAll(".default-player .thread > div")].some((row) => row.textContent.includes("Who is involved?"))
  ), null, { timeout: 2000 });

  await page.waitForFunction(() => document.querySelector(".default-player .strip")?.textContent?.includes("Listening"), null, { timeout: 15000 });

  // Collapse never hangs up: the bar says a call is running, reopening finds
  // the thread and the strip, and End marks where the call stopped.
  await page.locator(".default-player .chat-button").click();
  await page.waitForTimeout(400);

  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".default-player .chat-button .orb")).animationDuration), "the orb's quicker breath says so").toEqual("1.6s");

  await page.locator(".default-player .chat-button").click();
  await page.waitForSelector(".default-player .strip", { timeout: 2000 });

  const reopened = await panelState(page);
  expect(reopened.thread.length, "the thread survived the collapse").toBeGreaterThan(0);

  await page.locator(".default-player .pill", { hasText: "End" }).click();
  await page.waitForTimeout(300);

  const ended = await panelState(page);
  expect(ended.thread.at(-1), "the call marks its end in the thread").toEqual("Chat ended");
  expect(await page.locator(".default-player .composer input").count(), "the composer returns").toBeGreaterThan(0);
  expect(await page.locator(".default-player .voice").count(), "a fresh call can follow a finished one").toEqual(1);

  await page.locator(".default-player .voice").click();
  await page.waitForFunction(() => document.querySelector(".default-player .strip")?.textContent?.includes("Listening"), null, { timeout: 3000 });

  expect((await panelState(page)).thread, "the divider says nothing carries over").toContain("New voice chat — nothing carries over");
  await page.locator(".default-player .pill", { hasText: "End" }).click();
  await page.waitForTimeout(300);

  // Separate conversations: once a typed exchange exists there is no voice
  // entry to hand it to.
  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: null, agentVoiceSecondsLimit: null, shortcuts });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForFunction(() => !document.querySelector(".default-player .cursor") && document.querySelectorAll(".default-player .thread > div").length >= 2, null, { timeout: 15000 });

  expect(await page.locator(".default-player .voice").count(), "a text conversation removes the voice entry").toEqual(0);

  // Article audio pauses for the length of the call - not per exchange - and
  // ~30s of silence hangs up by itself (shortened through the test seam).
  await page.evaluate(() => { window.__agentSilenceTimeoutMs = 900; });
  await openPanel(page, { embedMode: "audio-agent", agentQuestionsLimit: null, agentVoiceSecondsLimit: null, shortcuts, playbackState: "playing", duration: 60, currentTime: 5 });

  await page.locator(".default-player .voice").click();
  await page.waitForFunction(() => document.querySelector(".default-player .strip")?.textContent?.includes("Listening"), null, { timeout: 3000 });

  expect(await playback(page), "the article pauses when the call starts").toEqual("paused");

  await page.waitForFunction(() => !document.querySelector(".default-player .strip"), null, { timeout: 3000 });

  expect((await panelState(page)).thread.at(-1), "silence ended the call").toEqual("Chat ended");
  expect(await playback(page), "and the article resumes at call end").toEqual("playing");
  await page.evaluate(() => { window.__agentSilenceTimeoutMs = undefined; window.disableAnimation = true; });

  // The answer is revealed as it arrives, not animated from a string the panel
  // already has: dots while the agent composes, then the text behind a caret.
  // Kept last, since it is the one case that needs animation left on.
  await page.evaluate(() => { window.disableAnimation = false; });
  await openPanel(page, { embedMode: "agent", agentQuestionsLimit: null, agentVoiceSecondsLimit: null, shortcuts });
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
  await openPanel(page, { embedMode: "agent", agentQuestionsLimit: null, agentVoiceSecondsLimit: null, shortcuts });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForSelector(".default-player .cursor", { timeout: 3000 });

  expect(await moves(page, ".default-player .cursor", "opacity"), "the caret blinks").toBeGreaterThan(1);

  // And holds still when the reader asked for that.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPanel(page, { embedMode: "agent", agentQuestionsLimit: null, agentVoiceSecondsLimit: null, shortcuts });

  expect(await moves(page, ".default-player .orb", "transform"), "reduced motion holds it").toEqual(1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

// The live client: an agentId selects it in place of the scripted mock, and it
// drives the same panel through the ElevenLabs SDK's callbacks. The SDK is
// stubbed at its loader seam, so this exercises everything but the network.
test("default player live agent behaviour", async ({ page }) => {
  await page.goto("http://localhost:8000");
  await waitForStylesToLoad(page);

  await page.evaluate(() => {
    window.__sdkLog = [];

    window.__elevenLabsClientStub = {
      Conversation: {
        startSession: async (config) => {
          window.__sdkLog.push({ event: "start", agentId: config.agentId, textOnly: !!config.textOnly, dynamicVariables: config.dynamicVariables });
          window.__conversationConfig = config;

          if (!config.textOnly) {
            setTimeout(() => config.onStatusChange?.({ status: "connected" }), 30);
          }

          return {
            sendUserMessage: (text) => {
              window.__sdkLog.push({ event: "message", text });

              setTimeout(() => {
                config.onMCPToolCall?.({
                  state: "success",
                  result: [{
                    type: "text",
                    text: JSON.stringify({ title: "A live answer", sourceUrl: "https://publisher.example/a-live-answer" }),
                  }],
                });
                config.onAgentChatResponsePart?.({ type: "start", text: "", event_id: 1 });
                config.onAgentChatResponsePart?.({ type: "delta", text: "A live ", event_id: 1 });
                config.onAgentChatResponsePart?.({ type: "delta", text: "answer.", event_id: 1 });
                config.onAgentChatResponsePart?.({ type: "stop", text: "", event_id: 1 });
              }, 50);
            },
            sendUserActivity: () => {},
            setMicMuted: () => {},
            endSession: async () => { window.__sdkLog.push({ event: "end" }); },
          };
        },
      },
    };
  });

  // Without an agentId the stub is never touched: the mock still answers.
  await openPanel(page, { embedMode: "audio-agent" });
  const input = page.locator(".default-player .composer input").first();
  await input.click();
  await input.type("Anyone there?");
  await input.press("Enter");
  await page.waitForTimeout(400);

  expect(await page.evaluate(() => window.__sdkLog), "no agentId, no SDK").toEqual([]);

  // With one, opening the panel still connects nothing; the first typed send
  // starts a text session carrying the id and the page's context.
  await openPanel(page, { embedMode: "audio-agent", agentId: "agent_wired123" });
  expect(await page.evaluate(() => window.__sdkLog), "opening the panel is free").toEqual([]);

  const wiredInput = page.locator(".default-player .composer input").first();
  await wiredInput.click();
  await wiredInput.type("What happened?");
  await wiredInput.press("Enter");
  await page.waitForTimeout(500);

  const log = await page.evaluate(() => window.__sdkLog);
  expect(log[0]).toMatchObject({ event: "start", agentId: "agent_wired123", textOnly: true });
  expect(log[0].dynamicVariables).toMatchObject({ title: "An article" });
  expect(log[1]).toMatchObject({ event: "message", text: "What happened?" });

  const answered = await panelState(page);
  expect(answered.thread, "the reply streamed in from response parts").toEqual(["What happened?", "A live answer."]);
  expect(await page.locator(".default-player .citation").getAttribute("href"), "the MCP article became a citation").toEqual("https://publisher.example/a-live-answer");

  // A voice call runs on the SDK's status and mode: connecting, listening,
  // talking - and the strip never promises a tap the SDK cannot deliver.
  await openPanel(page, { embedMode: "audio-agent", agentId: "agent_wired123" });
  await page.evaluate(() => { window.__sdkLog = []; });

  await page.locator(".default-player .composer .voice").click();
  await page.waitForTimeout(300);

  expect(await page.evaluate(() => window.__sdkLog.map((entry) => entry.event)), "the waveform opened a voice session").toEqual(["start"]);
  expect(await stripText(page), "and the call is live").toContain("Listening");

  await page.evaluate(() => window.__conversationConfig.onMessage({ message: "What changed this week?", role: "user", source: "user" }));
  await page.evaluate(() => window.__conversationConfig.onModeChange({ mode: "speaking" }));
  await page.waitForTimeout(100);

  expect(await stripText(page)).toContain("Talking — speak over it");
  expect(await page.locator(".default-player .strip-interrupt").count(), "no tap-to-interrupt on the live agent").toEqual(0);

  await page.evaluate(() => window.__conversationConfig.onMessage({ message: "Quite a lot.", role: "agent", source: "ai" }));
  await page.evaluate(() => window.__conversationConfig.onModeChange({ mode: "listening" }));
  await page.waitForTimeout(100);

  const call = await panelState(page);
  expect(call.thread).toEqual(["What changed this week?", "Quite a lot."]);
  expect(await stripText(page)).toContain("Listening");

  // End hangs up through the SDK and marks the thread.
  await page.locator(".default-player .strip .pill", { hasText: "End" }).click();
  await page.waitForTimeout(200);

  expect(await page.evaluate(() => window.__sdkLog.map((entry) => entry.event))).toEqual(["start", "end"]);
  expect((await panelState(page)).thread.at(-1)).toEqual("Chat ended");
  expect(await page.locator(".default-player .composer input").count(), "the composer came back").toBeGreaterThan(0);
});

test("default player translation behaviour uses established copy and falls back for new agent copy", async ({ page }) => {
  await page.goto("http://localhost:8000");
  await waitForStylesToLoad(page);

  await page.evaluate(async () => {
    const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 60 }];

    BeyondWords.Player.destroyAll();
    const player = new BeyondWords.Player({ target: ".beyondwords-player" });

    Object.assign(player, {
      playerStyle: "default",
      playerLanguage: "fr",
      embedMode: "audio-agent",
      content: [{ title: "Un article", audio }],
      shortcuts: ["Que s'est-il passé ?"],
    });

    await new Promise((resolve) => setTimeout(resolve, 400));
  });

  const root = page.locator(".default-player");
  await expect(root.locator(".title")).toHaveText("Écoutez cet article");
  await expect(root.locator(".play-pause")).toHaveAttribute("aria-label", "Lire l'audio");

  const chat = root.locator(".chat-button");
  await expect(chat).toHaveAttribute("aria-label", "Chat about this article");
  await chat.click();

  await expect(root.locator(".composer input")).toHaveAttribute(
    "placeholder",
    "Ask about this article, or anything we've covered…"
  );
  await expect(root.locator(".slash")).toHaveAttribute("aria-label", "Shortcuts");
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

const stripText = async (page) => await page.evaluate(() => (
  document.querySelector(".default-player .strip")?.textContent?.trim() || ""
));

const playback = async (page) => await page.evaluate(() => BeyondWords.Player.instances()[0].playbackState);

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
