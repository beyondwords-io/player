import { test, expect } from "@playwright/test";

// The agent's two interaction rules that cannot be seen in a screenshot: a
// locked agent still takes the question and answers with the publisher's offer,
// and the shortcuts list is the publisher's questions rather than invented
// commands.
test("default player agent behaviour", async ({ page }) => {
  await page.goto("http://localhost:8000");
  await waitForStylesToLoad(page);

  const shortcuts = ["What are today's headlines?", "Catch me up on this story", "What's new in my topics?"];

  // Locked, agent-only: the panel is inviting, and the wall comes after asking.
  await mountAgent(page, { agentAccess: "locked", shortcuts, agentCtaText: "Subscribe to ask questions", agentCtaUrl: "https://example.com/agent" });

  expect(await panelState(page), "a locked agent still invites a question").toEqual({
    chips: shortcuts,
    canSend: true,
    thread: [],
    ctaHref: null,
  });

  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForTimeout(300);

  expect(await panelState(page), "and answers it with the publisher's offer").toEqual({
    chips: [],
    canSend: false,
    thread: ["What are today's headlines?", "Subscribe to ask questions"],
    ctaHref: "https://example.com/agent",
  });

  // A locked agent with no copy at all still must not pretend to answer.
  await mountAgent(page, { agentAccess: "locked", shortcuts });
  await page.locator(".default-player .empty-chips button").first().click();
  await page.waitForTimeout(300);

  const withoutCta = await panelState(page);
  expect(withoutCta.thread[0]).toEqual("What are today's headlines?");
  expect(withoutCta.ctaHref).toEqual(null);
  expect(withoutCta.canSend).toEqual(false);

  // Shortcuts: pressing / lists the publisher's questions and typing narrows
  // them. No slugs, so nothing to collide and nothing to translate.
  await mountAgent(page, { agentAccess: "full", shortcuts });

  const input = page.locator(".default-player .composer input").first();
  await input.click();
  await input.press("/");
  await page.waitForTimeout(200);

  expect(await shortcutRows(page), "the whole list, as written").toEqual(shortcuts);

  await input.type("catch");
  await page.waitForTimeout(200);

  expect(await shortcutRows(page), "narrowed by what was typed").toEqual(["Catch me up on this story"]);

  await input.press("Enter");
  await page.waitForTimeout(300);

  const asked = await panelState(page);
  expect(asked.thread[0], "Enter takes the question, not the search").toEqual("Catch me up on this story");

  // A search that matches nothing gets out of the way.
  await input.press("/");
  await input.type("zzz");
  await page.waitForTimeout(200);

  expect(await page.locator(".default-player .shortcuts").count()).toEqual(0);
});

const mountAgent = async (page, params) => await page.evaluate(async (params) => {
  const audio = [{ id: 1, url: "http://example.com/a.mp3", contentType: "audio/mpeg", duration: 60 }];

  BeyondWords.Player.destroyAll();
  const player = new BeyondWords.Player({ target: ".beyondwords-player" });

  Object.assign(player, {
    playerStyle: "default",
    embedMode: "agent",
    content: [{ title: "An article", audio }],
    ...params,
  });

  await new Promise((resolve) => setTimeout(resolve, 400));
}, params);

const panelState = async (page) => await page.evaluate(() => {
  const root = document.querySelector(".default-player");

  return {
    chips: [...root.querySelectorAll(".empty-chips button")].map((chip) => chip.textContent.trim()),
    canSend: !!root.querySelector(".composer:not(.spent) input"),
    thread: [...root.querySelectorAll(".thread > div")].map((row) => row.textContent.trim()),
    ctaHref: root.querySelector(".thread a")?.getAttribute("href") || null,
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
