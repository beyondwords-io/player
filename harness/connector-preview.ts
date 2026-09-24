import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "./connector-preview.css";
import { createConnectorWidget } from "../src/connector";
import type { ConnectorProvider, ConnectorTheme, ConnectorWidget } from "../src/connector";
import { subscribeMediaQuery } from "../src/helpers/mediaQuery";

const find = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const form = find<HTMLFormElement>("controls");
const provider = find<HTMLSelectElement>("provider");
const theme = find<HTMLSelectElement>("theme");
const label = find<HTMLInputElement>("label");
const url = find<HTMLInputElement>("connect-url");
const width = find<HTMLInputElement>("preview-width");
const error = find<HTMLParagraphElement>("url-error");
const status = find<HTMLParagraphElement>("click-result");
const feedback = find<HTMLParagraphElement>("click-feedback");
const widgets: ConnectorWidget[] = [];
let feedbackTimer: ReturnType<typeof setTimeout>;

const mount = (target: string, options: { provider?: ConnectorProvider; theme?: ConnectorTheme; label?: string } = {}) => {
  const widget = createConnectorWidget({ target, connectUrl: "https://example.com/connect", ...options });
  // Intercept navigation in the review harness only. The widget remains an ordinary link.
  widget.element.addEventListener("click", (event) => {
    const anchor = event.composedPath().find((node) => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
    if (!anchor) { return; }
    event.preventDefault();
    status.textContent = `Would open: ${anchor.getAttribute("href")}`;
    feedback.hidden = false;
    feedback.textContent = status.textContent;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { feedback.hidden = true; }, 6000);
  });
  widgets.push(widget);
  return widget;
};

for (const theme of ["light", "dark"] as const) {
  for (const provider of [undefined, "claude", "chatgpt"] as const) {
    mount(`#${theme}-${provider ?? "generic"}`, { provider, theme });
  }
}
mount("#article-widget", { theme: "light" });
mount("#narrow-widget", { theme: "light", provider: "claude", label: "Explore our journalism with Claude" });
const live = mount("#live-widget");

let systemDark = false;
const updateStage = () => {
  const dark = theme.value === "dark" || (theme.value === "auto" && systemDark);
  find("live-stage").classList.toggle("dark-stage", dark);
  find("resolved-theme").textContent = `${theme.value === "auto" ? "Auto → " : ""}${dark ? "Dark" : "Light"}`;
};
const unsubscribe = subscribeMediaQuery("(prefers-color-scheme: dark)", (dark) => { systemDark = dark; updateStage(); });

const update = () => {
  live.update({
    provider: (provider.value || undefined) as ConnectorProvider | undefined,
    theme: theme.value as ConnectorTheme,
    label: label.value,
  });
  label.placeholder = provider.value === "claude" ? "Add to Claude" : provider.value === "chatgpt" ? "Add to ChatGPT" : "Add to AI assistant";
  find("width-guide").style.width = `${width.value}px`;
  find("width-value").textContent = `${width.value}px`;
  updateStage();

  try {
    live.update({ connectUrl: url.value });
    url.removeAttribute("aria-invalid");
    error.hidden = true;
    error.textContent = "";
    find("destination").textContent = url.value;
    status.textContent = "Preview clicks stay on this page.";
  } catch {
    url.setAttribute("aria-invalid", "true");
    error.hidden = false;
    error.textContent = "Enter a full http:// or https:// URL. The preview keeps the last valid destination.";
  }
};

form.addEventListener("submit", (event) => event.preventDefault());
form.addEventListener("input", update);
form.addEventListener("change", update);
// Wait for the browser's native reset to finish before reading the controls.
form.addEventListener("reset", () => setTimeout(update, 0));
find("try-long-label").addEventListener("click", () => {
  label.value = "Explore our journalism with your favourite AI assistant";
  width.value = "180";
  update();
});
update();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearTimeout(feedbackTimer);
    unsubscribe();
    widgets.forEach((widget) => widget.destroy());
  });
}
