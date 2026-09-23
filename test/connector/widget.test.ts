import { createConnectorWidget } from "../../src/connector";
import type { ConnectorWidget } from "../../src/connector";

describe("standalone connector widget", () => {
  let target: HTMLElement;
  let widgets: ConnectorWidget[];

  const mount = (options: Partial<Parameters<typeof createConnectorWidget>[0]> = {}) => {
    const widget = createConnectorWidget({ target, connectUrl: "https://publisher.example/connect", ...options });
    widgets.push(widget);
    return widget;
  };
  const link = (widget: ConnectorWidget) => widget.element.shadowRoot!.querySelector("a")!;

  beforeEach(() => {
    target = document.createElement("div");
    target.id = "connector-target";
    document.body.appendChild(target);
    widgets = [];
  });

  afterEach(() => {
    widgets.forEach((widget) => widget.destroy());
    target.remove();
    vi.unstubAllGlobals();
  });

  it("mounts an accessible generic link without clearing publisher content", () => {
    target.textContent = "Existing publisher content";
    const widget = mount({ target: "#connector-target" });
    expect(target.textContent).toBe("Existing publisher content");
    expect(target.contains(widget.element)).toBe(true);
    expect(link(widget).textContent).toBe("Add to AI assistant");
    expect(link(widget).getAttribute("href")).toBe("https://publisher.example/connect");
    expect(link(widget).querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(link(widget).dataset.theme).toBe("light");
  });

  it.each([
    ["claude", "Add to Claude"],
    ["chatgpt", "Add to ChatGPT"],
  ] as const)("uses the %s brand and default label", (provider, text) => {
    const widget = mount({ provider });
    expect(link(widget).textContent).toBe(text);
    expect(link(widget).querySelector("svg")?.getAttribute("viewBox")).toBe(provider === "claude" ? "0 0 32 32" : "0 0 320 320");
  });

  it("keeps connectUrl verbatim and independent of provider, including custom domains and paths", () => {
    const url = "https://NEWS.example/custom-setup?next=%2Farticle&ref=widget#instructions";
    const widget = mount({ connectUrl: url });
    widget.update({ provider: "claude" });
    expect(link(widget).getAttribute("href")).toBe(url);
    widget.update({ provider: "chatgpt", theme: "dark" });
    expect(link(widget).getAttribute("href")).toBe(url);
    widget.update({ connectUrl: "http://localhost:3000/my-own-page" });
    expect(link(widget).getAttribute("href")).toBe("http://localhost:3000/my-own-page");
  });

  it("renders labels as text, with optional overrides and predictable resets", () => {
    const widget = mount({ provider: "claude", label: '<img src=x onerror="alert(1)">' });
    expect(link(widget).textContent).toBe('<img src=x onerror="alert(1)">');
    expect(link(widget).querySelector("img")).toBeNull();
    widget.update({ provider: "chatgpt", label: "Read with your assistant" });
    expect(link(widget).textContent).toBe("Read with your assistant");
    widget.update({ label: "" });
    expect(link(widget).textContent).toBe("Add to ChatGPT");
    widget.update({ provider: undefined, label: undefined });
    expect(link(widget).textContent).toBe("Add to AI assistant");
  });

  it.each(["", "/connect", "//example.com", "javascript:alert(1)", "data:text/html,hello", "ftp://example.com"])("rejects an unsafe/incomplete destination: %s", (connectUrl) => {
    expect(() => mount({ connectUrl })).toThrow("complete HTTP(S) URL");
    expect(target.children.length).toBe(0);
  });

  it("validates updates before changing any displayed state", () => {
    const widget = mount();
    expect(() => widget.update({ connectUrl: "javascript:alert(1)", label: "Wrong", theme: "dark" })).toThrow();
    expect(link(widget).textContent).toBe("Add to AI assistant");
    expect(link(widget).dataset.theme).toBe("light");
    expect(link(widget).getAttribute("href")).toBe("https://publisher.example/connect");
  });

  it("rejects a missing mounting target", () => {
    expect(() => mount({ target: "#missing-target" })).toThrow("HTML element");
  });

  it("uses the approved literal light and dark presets", () => {
    const widget = mount({ theme: "light" });
    expect(link(widget).style.getPropertyValue("--connector-background")).toBe("#f5f5f5");
    expect(link(widget).style.getPropertyValue("--connector-text")).toBe("#212121");
    widget.update({ theme: "dark" });
    expect(link(widget).style.getPropertyValue("--connector-background")).toBe("#212121");
    expect(link(widget).style.getPropertyValue("--connector-text")).toBe("#fafafa");
  });

  it("follows live system changes in Auto and cleans up listeners on theme changes and destroy", () => {
    const listeners = new Set<() => void>();
    const query = {
      matches: true,
      addEventListener: vi.fn((_name: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_name: string, listener: () => void) => listeners.delete(listener)),
    };
    vi.stubGlobal("matchMedia", vi.fn(() => query));
    const widget = mount();
    expect(link(widget).dataset.theme).toBe("dark");
    query.matches = false;
    listeners.forEach((listener) => listener());
    expect(link(widget).dataset.theme).toBe("light");
    widget.update({ theme: "dark" });
    expect(listeners.size).toBe(0);
    expect(link(widget).dataset.theme).toBe("dark");
    widget.update({ theme: "auto" });
    expect(listeners.size).toBe(1);
    expect(link(widget).dataset.theme).toBe("light");
    widget.update({ label: "Still Auto" });
    expect(listeners.size).toBe(1);
    widget.destroy();
    expect(listeners.size).toBe(0);
  });

  it("keeps instances independent and only removes its own markup", () => {
    target.appendChild(document.createElement("p"));
    const first = mount({ theme: "light" });
    const second = mount({ provider: "claude", theme: "dark" });
    first.update({ provider: "chatgpt" });
    expect(link(second).textContent).toBe("Add to Claude");
    expect(link(second).dataset.theme).toBe("dark");
    expect(document.querySelector("[data-connector-widget] a")).toBeNull();
    expect(document.head.querySelector("style")).toBeNull();
    first.destroy();
    first.destroy();
    expect(target.children.length).toBe(2);
    expect(target.contains(second.element)).toBe(true);
    expect(() => first.update({ theme: "dark" })).toThrow("destroyed");
  });
});
