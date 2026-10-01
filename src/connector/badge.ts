import { PLAYER_COLOR_PRESETS } from "../helpers/default_theme/palettes";
import { connectorIcons } from "./icons";
import { connectorLabels, type ConnectorProvider } from "./providers";
import type { ConnectorTheme } from "./index";

const widths = { generic: 178, claude: 145, chatgpt: 157, grok: 130 };

export const renderConnectorBadge = (provider?: ConnectorProvider, theme: ConnectorTheme = "auto"): string => {
  const key = provider ?? "generic";
  const icon = connectorIcons[key];
  const label = connectorLabels[key];
  const width = widths[key];
  const palette = PLAYER_COLOR_PRESETS[theme === "dark" ? "dark" : "light"];
  const dark = PLAYER_COLOR_PRESETS.dark;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="38" viewBox="0 0 ${width} 38" role="img" aria-label="${label}">
  <title>${label}</title>
  <style>
    svg { color: ${palette.textColor}; }
    .surface { fill: ${palette.backgroundColor}; }
    ${theme === "auto" ? `@media (prefers-color-scheme: dark) { svg { color: ${dark.textColor}; } .surface { fill: ${dark.backgroundColor}; } }` : ""}
  </style>
  <rect class="surface" width="${width}" height="38" rx="9" />
  <svg x="11" y="10.5" width="17" height="17" viewBox="${icon.viewBox}" aria-hidden="true" focusable="false"><path fill="${icon.fill}" d="${icon.path}" /></svg>
  <text x="35" y="23.5" fill="currentColor" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" font-size="13.5" font-weight="500" letter-spacing="-0.003em">${label}</text>
</svg>\n`;
};
