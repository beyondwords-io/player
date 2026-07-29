import { parseColor, toAlphaString, luminance, contrastRatio, mix, clampContrast } from "./colorMath";

// The 11-colour contract for the "default" player style. Presets fill every
// property; theme "custom" starts from light and overrides per property.
const PRESETS = {
  light: {
    backgroundColor: "#f5f5f5",
    textColor: "#212121",
    iconColor: "#212121",
    highlightColor: "rgba(148, 59, 252, 0.07)",
    wordHighlightColor: "rgba(148, 59, 252, 0.28)",
    videoTextColor: "#ffffff",
    videoIconColor: "#ffffff",
    agentColor: "#943bfc,#e23ad0",
    agentAvatar: undefined,
    accentColor: undefined,
    accentTextColor: undefined,
  },
  dark: {
    backgroundColor: "#212121",
    textColor: "#fafafa",
    iconColor: "#fafafa",
    highlightColor: "rgba(148, 59, 252, 0.22)",
    wordHighlightColor: "rgba(148, 59, 252, 0.48)",
    videoTextColor: "#ffffff",
    videoIconColor: "#ffffff",
    agentColor: "#943bfc,#e23ad0",
    agentAvatar: undefined,
    accentColor: undefined,
    accentTextColor: undefined,
  },
};

const TEXT_CONTRAST_FLOOR = 4.5;
const ICON_CONTRAST_FLOOR = 3;
const ORB_NEAR_BACKGROUND_RATIO = 1.6;

const parseAgentColor = (value) => {
  const parts = (Array.isArray(value) ? value : String(value || "").split(","))
    .map((part) => String(part).trim())
    .filter((part) => parseColor(part));

  const from = parts[0] || "#943bfc";
  const to = parts[1];

  return { from, to, css: to ? `linear-gradient(100deg, ${from}, ${to})` : from };
};

const scaleRadius = (radius) => {
  const base = Math.max(0, Math.min(16, Number.isFinite(Number(radius)) ? Number(radius) : 8));

  return {
    bar: `${base}px`,
    control: `${Math.max(3, Math.round(base * 0.75))}px`,
    bubble: `${Math.max(4, Math.round(base * 1.25))}px`,
  };
};

// overrides = only colours the publisher (or API) explicitly set; everything
// else comes from the theme preset. Every visible pair is contrast-clamped so
// an illegible player is impossible to configure.
const deriveTokens = ({ theme = "light", radius = 8, overrides = {}, pageDark = false } = {}) => {
  const preset = PRESETS[theme === "dark" ? "dark" : "light"];

  const defined = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined && value !== null && value !== "") { defined[key] = value; }
  }

  const input = { ...preset, ...defined };

  const background = parseColor(input.backgroundColor) ? input.backgroundColor : preset.backgroundColor;
  const isDark = luminance(background) < 0.35;

  const text = clampContrast(input.textColor, background, TEXT_CONTRAST_FLOOR);
  const icon = clampContrast(input.iconColor, background, ICON_CONTRAST_FLOOR);

  const agent = parseAgentColor(input.agentColor);
  const hasAvatar = !!input.agentAvatar;
  const orbNearBackground = contrastRatio(agent.from, background) < ORB_NEAR_BACKGROUND_RATIO;

  const bubbleBackground = input.accentColor || (isDark ? mix(background, "#ffffff", 0.1) : "#ffffff");
  const bubbleText = clampContrast(input.accentTextColor || text, bubbleBackground, TEXT_CONTRAST_FLOOR);

  const agentTint = hasAvatar ? text : agent.from;
  const citation = clampContrast(agentTint, bubbleBackground, TEXT_CONTRAST_FLOOR);
  const link = clampContrast(agentTint, background, TEXT_CONTRAST_FLOOR);

  return {
    isDark,
    background,
    text,
    icon,
    highlight: input.highlightColor,
    wordHighlight: input.wordHighlightColor,
    videoText: input.videoTextColor,
    videoIcon: input.videoIconColor,

    // Neutral tints derive from textColor, flipping with background luminance.
    divider: toAlphaString(text, isDark ? 0.15 : 0.08),
    track: toAlphaString(text, isDark ? 0.2 : 0.1),
    hover: toAlphaString(text, 0.05),
    pressed: toAlphaString(text, 0.1),
    underline: toAlphaString(text, 0.45),
    muted: mix(text, background, 0.45),
    placeholder: mix(text, background, 0.45),
    skeleton: toAlphaString(text, isDark ? 0.09 : 0.08),

    orb: agent.css,
    orbSolid: agent.from,
    orbRing: orbNearBackground ? "0 0 0 1px rgba(255, 255, 255, 0.4)" : "none",
    hasAvatar,
    avatarUrl: hasAvatar ? input.agentAvatar : undefined,

    bubbleBackground,
    bubbleText,
    sendBackground: input.accentColor || text,
    sendIcon: input.accentTextColor || background,
    citation,
    citationBorder: mix(citation, bubbleBackground, 0.65),
    link,

    barRing: pageDark ? "0 0 0 1px rgba(255, 255, 255, 0.1)" : "none",
    widgetShadow: `${pageDark ? "0 0 0 1px rgba(255, 255, 255, 0.1), " : ""}0 0 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.2)`,

    radius: scaleRadius(radius),
  };
};

export default deriveTokens;
export { PRESETS, parseAgentColor, scaleRadius };
