import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const previewUrl = "http://localhost:8000/connector-preview.html";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(previewUrl);
  await expect(page.locator("#live-widget").getByRole("link")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
});

test("connector widget accessibility, themes, and isolated rendering", async ({ page, isMobile }, testInfo) => {
  const light = page.locator("#light-variants").getByRole("link");
  const dark = page.locator("#dark-variants").getByRole("link");
  const minHeight = await page.evaluate(() => matchMedia("(pointer: coarse)").matches ? 44 : 38);
  await expect(light).toHaveCount(3);
  await expect(dark).toHaveCount(3);
  for (const link of await page.locator("[data-connector-widget]").getByRole("link").all()) {
    const bounds = await link.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(minHeight);
    await expect(link).toHaveCSS("min-height", `${minHeight}px`);
    await expect(link.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(link.locator("svg")).toHaveAttribute("focusable", "false");
    await expect(link.locator("svg")).toHaveCSS("width", "17px");
    await expect(link.locator("svg")).toHaveCSS("height", "17px");
  }
  expect((await light.first().boundingBox())!.height).toBe(minHeight);
  await expect(light.first()).toHaveCSS("gap", "7px");
  await expect(light.first()).toHaveCSS("border-radius", "9px");
  await expect(light.first()).toHaveCSS("font-weight", "500");
  await expect(light.first()).toHaveCSS("line-height", "20px");
  await expect(light.first()).toHaveCSS("touch-action", "manipulation");
  if (await page.evaluate(() => CSS.supports("text-box", "trim-both cap alphabetic"))) {
    await expect(light.first().locator(".label")).toHaveCSS("text-box-trim", "trim-both");
    await expect(light.first().locator(".label")).toHaveCSS("text-box-edge", "cap alphabetic");
  }
  await expect(light.first()).toHaveCSS("background-color", "rgb(245, 245, 245)");
  await expect(light.first()).toHaveCSS("color", "rgb(33, 33, 33)");
  await expect(dark.first()).toHaveCSS("background-color", "rgb(33, 33, 33)");
  await expect(dark.first()).toHaveCSS("color", "rgb(250, 250, 250)");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  if (!isMobile) {
    await light.first().hover();
    expect(await light.first().evaluate((element) => getComputedStyle(element, "::before").backgroundColor)).toBe("rgb(0, 0, 0)");
    expect(await light.first().evaluate((element) => getComputedStyle(element, "::before").opacity)).toBe("0.05");
    await dark.first().hover();
    expect(await dark.first().evaluate((element) => getComputedStyle(element, "::before").backgroundColor)).toBe("rgb(255, 255, 255)");
    await page.mouse.down();
    expect(await dark.first().evaluate((element) => getComputedStyle(element, "::before").opacity)).toBe("0.1");
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }

  // Typical hostile publisher styles must not change the embedded buttons.
  const publisherStyles = await page.addStyleTag({ content: "a { padding: 70px !important; color: red !important; font-size: 60px !important; } svg { width: 100px !important; }" });
  await expect(light.first()).toHaveCSS("padding-left", "11px");
  await expect(light.first()).toHaveCSS("padding-right", "14px");
  await expect(light.first()).toHaveCSS("padding-top", "0px");
  await expect(light.first()).toHaveCSS("padding-bottom", "0px");
  await expect(light.first()).toHaveCSS("font-size", "13.5px");
  await expect(light.first().locator("svg")).toHaveCSS("width", "17px");
  await expect(light.first()).toHaveCSS("color", "rgb(33, 33, 33)");
  await publisherStyles.evaluate((element) => element.remove());
  await page.screenshot({ path: testInfo.outputPath("connector-preview.png"), fullPage: true });
});

test("connector widget supports keyboard navigation without leaving the preview", async ({ page }) => {
  await page.locator(".wordmark").focus();
  await page.keyboard.press("Tab");
  const link = page.locator("#light-generic").getByRole("link", { name: "Add to AI assistant" });
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS("outline-style", "solid");
  await expect(link).toHaveCSS("outline-width", "2px");
  await page.keyboard.press("Enter");
  await expect(page.locator("#click-result")).toHaveText("Would open: https://example.com/connect");
  expect(page.url()).toBe(previewUrl);
});

test("connector widget controls keep destination separate from provider and support live Auto", async ({ page }) => {
  const live = page.locator("#live-widget").getByRole("link");
  const customUrl = "https://publisher.example/get-started?source=article#steps";
  await page.getByLabel("Destination URL").fill(customUrl);
  await page.getByLabel("Button", { exact: true }).selectOption("claude");
  await expect(live).toHaveText("Add to Claude");
  await expect(live).toHaveAttribute("href", customUrl);
  await page.getByLabel("Button", { exact: true }).selectOption("chatgpt");
  await expect(live).toHaveText("Add to ChatGPT");
  await expect(live).toHaveAttribute("href", customUrl);
  await page.getByLabel("Label optional").fill("Read with your assistant");
  await expect(live).toHaveText("Read with your assistant");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(live).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#light-generic").getByRole("link")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Theme", { exact: true }).selectOption("light");
  await expect(live).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Theme", { exact: true }).selectOption("auto");
  await expect(live).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(live).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Destination URL").fill("javascript:alert(1)");
  await expect(page.locator("#url-error")).toBeVisible();
  await expect(live).toHaveAttribute("href", customUrl);
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(live).toHaveText("Add to AI assistant");
  await expect(live).toHaveAttribute("href", "https://example.com/connect");
});

test("connector widget wraps long labels on narrow pages without shrinking the logo", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole("button", { name: "Try a longer label" }).click();
  const live = page.locator("#live-widget").getByRole("link");
  const bounds = await live.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(180);
  expect(bounds!.height).toBeGreaterThan(44);
  await expect(live.locator("svg")).toHaveCSS("width", "17px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  expect(await live.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.locator("#live-stage").screenshot({ path: testInfo.outputPath("connector-narrow.png") });
});

test("connector preview loads without player, audio, or agent modules", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  await page.reload();
  await expect(page.locator("#live-widget").getByRole("link")).toBeVisible();
  expect(urls.filter((url) => /\/src\/index\.ts|elevenlabs|elevenLabsSdk|hls\.light|\/player\/by_/.test(url))).toEqual([]);
  await expect(page.locator("audio, video")).toHaveCount(0);
});
