import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import type { Connector } from "../../src/connector";
import AxeBuilder from "@axe-core/playwright";

const root = fileURLToPath(new URL("../..", import.meta.url));
const origin = "http://localhost:8000";
const scriptUrl = `${origin}/dist/connector.js`;
const moduleUrl = `${origin}/dist/connector.mjs`;
const exampleUrl = `${origin}/connector-embed.html`;
type EmbedWindow = Window & {
  BeyondWords: { Connector: typeof Connector; Player?: unknown };
  connector?: Connector;
  previousConnector?: typeof Connector;
  previousPlayer?: unknown;
};

test.beforeEach(async ({ page }) => {
  // Serve the release files verbatim, like a static CDN. Vite's development
  // transforms must not rewrite production bundles or resolve their imports.
  for (const file of ["connector.js", "connector.mjs", "umd.js"]) {
    await page.route(`${origin}/dist/${file}`, (route) => route.fulfill({
      contentType: "application/javascript", body: readFileSync(resolve(root, "dist", file)),
    }));
  }
});

// Serve plain publisher HTML: no Vite injection or source-module imports.
const openPublisherPage = async (page: Page, body = '<main><div id="connector"><p>Publisher content</p></div></main>') => {
  await page.route(`${origin}/connector-publisher-test`, (route) => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Publisher</title></head><body>${body}</body></html>`,
  }));
  await page.goto(`${origin}/connector-publisher-test`);
};

test("connector build contains only the standalone dependency graph and fits the size budget", async () => {
  for (const filename of ["connector.js", "connector.mjs"]) {
    const code = readFileSync(resolve(root, "dist", filename));
    const sourceMap = JSON.parse(readFileSync(resolve(root, "dist", `${filename}.map`), "utf8"));
    const allowedSources = [
      "src/connector/index.ts", "src/connector/browser.ts", "src/connector/icons.ts", "src/connector/widget.css",
      "src/helpers/mediaQuery.ts", "src/helpers/default_theme/palettes.ts",
    ];
    for (const source of sourceMap.sources) {
      expect(allowedSources.some((allowed) => source.endsWith(allowed)), source).toBe(true);
    }
    expect(gzipSync(code).byteLength).toBeLessThan(8_000);
    expect(code.toString()).not.toMatch(/elevenlabs|Hls|SvelteComponent|fetch\(|XMLHttpRequest|import\(/);
  }
});

test("connector module package export works without a browser and includes usable TypeScript declarations", async () => {
  const metadata = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  expect(existsSync(resolve(root, metadata.exports["./connector"].types))).toBe(true);
  const output = execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { Connector, createConnectorWidget } from '@beyondwords/player/connector';
    console.log(JSON.stringify({ constructor: typeof Connector, factory: typeof createConnectorWidget, global: typeof globalThis.BeyondWords }));
  `], { cwd: root, encoding: "utf8" });
  expect(JSON.parse(output)).toEqual({ constructor: "function", factory: "function", global: "undefined" });

  execFileSync(process.execPath, [
    resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit", "--strict", "--module", "NodeNext",
    "--moduleResolution", "NodeNext", "--target", "ES2022", "--lib", "ES2022,DOM", "--skipLibCheck",
    resolve(root, "test/fixtures/connector-consumer.ts"),
  ], { cwd: root, encoding: "utf8" });
});

test("connector plain-script example loads one self-contained asset with all three variants", async ({ page }, testInfo) => {
  const resources: string[] = [];
  page.on("request", (request) => {
    if (["script", "stylesheet", "font", "fetch", "xhr", "media"].includes(request.resourceType())) { resources.push(request.url()); }
  });
  await page.route(exampleUrl, (route) => route.fulfill({
    contentType: "text/html", body: readFileSync(resolve(root, "connector-embed.html"), "utf8"),
  }));
  await page.goto(exampleUrl);
  await expect(page.getByRole("link", { name: "Add to AI assistant", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Add to Claude", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Add to ChatGPT", exact: true })).toBeVisible();
  await expect(page.locator("#load-error")).toBeHidden();
  expect(resources).toEqual([scriptUrl]);
  expect(await page.evaluate(() => typeof (window as EmbedWindow).BeyondWords.Player)).toBe("undefined");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("standalone-embed.png"), fullPage: true });
});

test("connector script performs real navigation to the supplied URL without rewriting it", async ({ page }) => {
  await openPublisherPage(page);
  await page.addScriptTag({ url: scriptUrl });
  const destination = "https://publisher.example/my-own-setup?source=article#instructions";
  await page.route("https://publisher.example/**", (route) => route.fulfill({ contentType: "text/html", body: "<h1>Publisher setup</h1>" }));
  await page.evaluate((connectUrl) => {
    new (window as EmbedWindow).BeyondWords.Connector({ target: "#connector", connectUrl, provider: "claude" });
  }, destination);
  const link = page.getByRole("link", { name: "Add to Claude" });
  await expect(link).toHaveAttribute("href", destination);
  await link.click();
  await expect(page).toHaveURL(destination);
  await expect(page.getByRole("heading", { name: "Publisher setup" })).toBeVisible();
});

test("connector script runtime updates, live Auto, and cleanup work in the built artifact", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openPublisherPage(page);
  await page.addScriptTag({ url: scriptUrl });
  await page.evaluate(() => {
    const scope = window as EmbedWindow;
    scope.connector = new scope.BeyondWords.Connector({ target: "#connector", connectUrl: "https://example.com/setup" });
  });
  const link = page.locator("[data-connector-widget]").getByRole("link");
  await expect(link).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(link).toHaveAttribute("data-theme", "dark");
  await page.evaluate(() => (window as EmbedWindow).connector!.update({ provider: "chatgpt", label: "Our reporting", theme: "light" }));
  await expect(link).toHaveText("Our reporting");
  await expect(link).toHaveAttribute("data-theme", "light");
  await expect(link).toHaveAttribute("href", "https://example.com/setup");
  await page.evaluate(() => (window as EmbedWindow).connector!.destroy());
  await expect(page.locator("[data-connector-widget]")).toHaveCount(0);
  await expect(page.locator("#connector")).toHaveText("Publisher content");
});

test("connector script is repeat-load safe on pages with an AMD loader", async ({ page }) => {
  await openPublisherPage(page);
  await page.evaluate(() => {
    Reflect.set(window, "define", Object.assign(() => { throw new Error("Unexpected AMD registration"); }, { amd: {} }));
  });
  await page.addScriptTag({ url: scriptUrl });
  await page.evaluate(() => {
    const scope = window as EmbedWindow;
    scope.previousConnector = scope.BeyondWords.Connector;
    scope.connector = new scope.BeyondWords.Connector({ target: "#connector", connectUrl: "https://example.com/setup" });
  });
  await page.addScriptTag({ url: scriptUrl });
  expect(await page.evaluate(() => {
    const scope = window as EmbedWindow;
    return scope.previousConnector === scope.BeyondWords.Connector && scope.connector instanceof scope.BeyondWords.Connector;
  })).toBe(true);
  await expect(page.locator("[data-connector-widget]")).toHaveCount(1);
});

for (const playerFirst of [true, false]) {
  test(`connector and player bundles preserve each other with ${playerFirst ? "player" : "connector"} loaded first`, async ({ page }) => {
    await openPublisherPage(page);
    const playerUrl = `${origin}/dist/umd.js`;
    await page.addScriptTag({ url: playerFirst ? playerUrl : scriptUrl });
    await page.evaluate(() => {
      const scope = window as EmbedWindow;
      scope.previousPlayer = scope.BeyondWords.Player;
      scope.previousConnector = scope.BeyondWords.Connector;
    });
    await page.addScriptTag({ url: playerFirst ? scriptUrl : playerUrl });
    expect(await page.evaluate((playerFirst) => {
      const scope = window as EmbedWindow;
      return typeof scope.BeyondWords.Player === "function" && typeof scope.BeyondWords.Connector === "function" &&
        (playerFirst ? scope.BeyondWords.Player === scope.previousPlayer : scope.BeyondWords.Connector === scope.previousConnector);
    }, playerFirst)).toBe(true);
  });
}

test("connector ESM artifact mounts independently without registering browser globals", async ({ page }) => {
  await openPublisherPage(page);
  const resources: string[] = [];
  page.on("request", (request) => resources.push(request.url()));
  await page.addScriptTag({ type: "module", content: `
    import { Connector } from '${moduleUrl}';
    new Connector({ target: '#connector', connectUrl: 'https://example.com/setup', provider: 'chatgpt' });
  ` });
  await expect(page.getByRole("link", { name: "Add to ChatGPT" })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, "BeyondWords"))).toBeUndefined();
  expect(resources).toEqual([moduleUrl]);
});
