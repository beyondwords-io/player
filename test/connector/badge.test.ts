import { renderConnectorBadge } from "../../src/connector/badge";
import { connectorLabels } from "../../src/connector/providers";

describe("static Connector badges", () => {
  for (const provider of [undefined, "claude", "chatgpt", "grok"] as const) {
    it.each(["light", "dark", "auto"] as const)(`renders a standalone ${provider ?? "generic"} %s SVG`, (theme) => {
      const source = renderConnectorBadge(provider, theme);
      const svg = new DOMParser().parseFromString(source, "image/svg+xml");
      expect(svg.querySelector("parsererror")).toBeNull();
      expect(svg.documentElement.getAttribute("role")).toBe("img");
      expect(svg.documentElement.getAttribute("aria-label")).toBe(connectorLabels[provider ?? "generic"]);
      expect(svg.querySelector("text")?.textContent).toBe(connectorLabels[provider ?? "generic"]);
      expect(svg.querySelector("svg svg")?.getAttribute("width")).toBe("17");
      expect(svg.querySelector("svg svg")?.getAttribute("focusable")).toBe("false");
      expect(svg.querySelector("rect")?.getAttribute("rx")).toBe("9");
      expect(svg.querySelector("script, foreignObject, image, a")).toBeNull();
      expect(source).not.toMatch(/@import|url\(|onload=|onclick=|href=/i);
      expect(source.includes("prefers-color-scheme")).toBe(theme === "auto");
      expect(source).toContain(theme === "dark" ? "fill: #212121" : "fill: #f5f5f5");
    });
  }
});
