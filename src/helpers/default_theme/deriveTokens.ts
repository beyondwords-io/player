import { contrastRatio, firstColorStop, parseColor } from "./colorMath";
import {
  completePlayerTheme,
  completeVideoTheme,
  type PlayerColorTheme,
  type PlayerThemeName,
  type VideoColorTheme,
} from "./palettes";

const ORB_NEAR_BACKGROUND_RATIO = 1.6;

const splitTopLevelCommas = (value: string) => {
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "(") { depth += 1; }
    if (value[index] === ")") { depth = Math.max(0, depth - 1); }
    if (value[index] === "," && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
};

// A CSS colour or gradient is literal. Only the old comma-separated shorthand
// is translated, so integrations do not need to migrate in lockstep.
const parseAgentColor = (value: unknown) => {
  if (Array.isArray(value)) {
    const parts = value.map(String).map((part) => part.trim()).filter(Boolean);
    const from = parts[0];
    return { from, to: parts[1], css: parts[1] ? `linear-gradient(100deg, ${from}, ${parts[1]})` : from };
  }

  const css = String(value ?? "");
  const legacyParts = splitTopLevelCommas(css);
  if (legacyParts.length > 1) {
    return {
      from: legacyParts[0],
      to: legacyParts[1],
      css: `linear-gradient(100deg, ${legacyParts[0]}, ${legacyParts[1]})`,
    };
  }

  return { from: firstColorStop(css) || css, to: undefined, css };
};

const scaleRadius = (radius: unknown) => {
  const base = Math.max(0, Math.min(16, Number.isFinite(Number(radius)) ? Number(radius) : 8));

  return {
    bar: `${base}px`,
    control: `${Math.max(3, Math.round(base * 0.75))}px`,
    bubble: `${Math.max(4, Math.round(base * 1.25))}px`,
    track: `${Math.round(base * 0.5)}px`,
  };
};

interface DeriveTokenOptions {
  theme?: string;
  radius?: unknown;
  palette?: Partial<PlayerColorTheme>;
  videoTheme?: Partial<VideoColorTheme>;
  // Kept for direct component users and deprecated flat SDK properties.
  overrides?: Partial<PlayerColorTheme> & {
    videoBackgroundColor?: string;
    videoTextColor?: string;
    videoIconColor?: string;
    videoSubtleColor?: string;
    agentAvatar?: string;
  };
  pageDark?: boolean;
  pageBackground?: string;
  agentAvatar?: string;
}

const deriveTokens = ({
  theme = "light",
  radius = 8,
  palette,
  videoTheme,
  overrides = {},
  pageDark = false,
  agentAvatar,
}: DeriveTokenOptions = {}) => {
  const selectedTheme: PlayerThemeName = theme === "dark" ? "dark" : "light";
  const player = completePlayerTheme(selectedTheme, palette, overrides);
  const video = completeVideoTheme(videoTheme, {
    backgroundColor: overrides.videoBackgroundColor,
    textColor: overrides.videoTextColor,
    iconColor: overrides.videoIconColor,
    subtleColor: overrides.videoSubtleColor,
  });
  const hover = selectedTheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
  const pressed = selectedTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  const agent = parseAgentColor(player.agentColor);
  const avatarUrl = agentAvatar ?? overrides.agentAvatar;
  const measurableBackground = parseColor(player.backgroundColor)
    ? player.backgroundColor
    : firstColorStop(player.backgroundColor);
  const orbNearBackground = !!agent.from && !!measurableBackground
    && !!parseColor(agent.from) && !!parseColor(measurableBackground)
    && contrastRatio(agent.from, measurableBackground) < ORB_NEAR_BACKGROUND_RATIO;

  return {
    isDark: selectedTheme === "dark",
    background: player.backgroundColor,
    backgroundBase: player.backgroundColor,
    text: player.textColor,
    secondary: player.secondaryTextColor,
    icon: player.iconColor,
    subtle: player.subtleColor,
    highlight: player.highlightColor,
    wordHighlight: player.wordHighlightColor,
    videoBackground: video.backgroundColor,
    videoText: video.textColor,
    videoIcon: video.iconColor,
    videoSubtle: video.subtleColor,

    // Interaction treatments stay internal effects; visible roles are literal.
    hover,
    pressed,
    divider: player.subtleColor,
    track: player.subtleColor,
    muted: player.secondaryTextColor,
    placeholder: player.secondaryTextColor,
    skeleton: player.subtleColor,
    underline: player.linkColor,

    orb: agent.css,
    orbSolid: agent.from,
    orbRing: orbNearBackground ? "0 0 0 1px rgba(255, 255, 255, 0.4)" : "none",
    hasAvatar: !!avatarUrl,
    avatarUrl,

    // The accent pair gives user messages and suggested user-message shortcuts
    // one conversational treatment. Filled controls use the icon role for
    // their visible shape and the surface role for their cut-out.
    bubbleBackground: player.accentColor,
    bubbleText: player.accentTextColor,
    sendBackground: player.iconColor,
    sendIcon: player.backgroundColor,
    citation: player.linkColor,
    citationBorder: player.subtleColor,
    link: player.linkColor,

    barRing: pageDark ? "0 0 0 1px rgba(255, 255, 255, 0.1)" : "none",
    widgetShadow: `${pageDark ? "0 0 0 1px rgba(255, 255, 255, 0.1), " : ""}0 0 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.2)`,
    radius: scaleRadius(radius),
  };
};

export default deriveTokens;
export { parseAgentColor, scaleRadius };
