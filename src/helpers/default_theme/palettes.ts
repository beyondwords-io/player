export type PlayerThemeName = "light" | "dark";
export type PlayerThemePreference = PlayerThemeName | "auto";

export interface PlayerColorTheme {
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  iconColor: string;
  subtleColor: string;
  linkColor: string;
  highlightColor: string;
  wordHighlightColor: string;
  agentColor: string;
  accentColor: string;
  accentTextColor: string;
}

export interface VideoColorTheme {
  backgroundColor: string;
  textColor: string;
  iconColor: string;
  subtleColor: string;
}

export const PLAYER_COLOR_PRESETS: Record<PlayerThemeName, PlayerColorTheme> = {
  light: {
    backgroundColor: "#f5f5f5",
    textColor: "#212121",
    secondaryTextColor: "#6d6d6d",
    iconColor: "#212121",
    subtleColor: "rgba(33, 33, 33, 0.1)",
    linkColor: "#8d38ef",
    highlightColor: "rgba(164, 255, 0, 0.2)",
    wordHighlightColor: "rgba(164, 255, 0, 0.8)",
    agentColor: "linear-gradient(100deg, #943bfc, #e23ad0)",
    accentColor: "#ffffff",
    accentTextColor: "#212121",
  },
  dark: {
    backgroundColor: "#212121",
    textColor: "#fafafa",
    secondaryTextColor: "#989898",
    iconColor: "#fafafa",
    subtleColor: "rgba(250, 250, 250, 0.18)",
    linkColor: "#af6cfd",
    highlightColor: "rgba(164, 255, 0, 0.2)",
    wordHighlightColor: "rgba(164, 255, 0, 0.4)",
    agentColor: "linear-gradient(100deg, #943bfc, #e23ad0)",
    accentColor: "#373737",
    accentTextColor: "#fafafa",
  },
};

export const VIDEO_COLOR_PRESET: VideoColorTheme = {
  backgroundColor: "#000000",
  textColor: "#ffffff",
  iconColor: "#ffffff",
  subtleColor: "rgba(255, 255, 255, 0.3)",
};

export const PLAYER_COLOR_KEYS = Object.keys(PLAYER_COLOR_PRESETS.light) as (keyof PlayerColorTheme)[];
export const VIDEO_COLOR_KEYS = Object.keys(VIDEO_COLOR_PRESET) as (keyof VideoColorTheme)[];

const PLAYER_API_KEYS: Record<keyof PlayerColorTheme, string> = {
  backgroundColor: "background_color",
  textColor: "text_color",
  secondaryTextColor: "secondary_text_color",
  iconColor: "icon_color",
  subtleColor: "subtle_color",
  linkColor: "link_color",
  highlightColor: "highlight_color",
  wordHighlightColor: "word_highlight_color",
  agentColor: "agent_color",
  accentColor: "accent_color",
  accentTextColor: "accent_text_color",
};

const VIDEO_API_KEYS: Record<keyof VideoColorTheme, string> = {
  backgroundColor: "background_color",
  textColor: "text_color",
  iconColor: "icon_color",
  subtleColor: "subtle_color",
};

// Missing means absent. Empty and invalid CSS strings are still publisher
// values and deliberately survive every merge unchanged.
const mergePresent = <T extends object>(...sources: (Partial<T> | null | undefined)[]): Partial<T> => {
  const result: Partial<T> = {};

  for (const source of sources) {
    if (!source) { continue; }
    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined && value !== null) { result[key] = value; }
    }
  }

  return result;
};

const normalizeThemePreference = (theme: unknown): PlayerThemePreference => (
  theme === "dark" ? "dark" : theme === "auto" ? "auto" : "light"
);

const resolveThemePreference = (theme: unknown, systemDark = false): PlayerThemeName => {
  const normalized = normalizeThemePreference(theme);
  return normalized === "auto" ? (systemDark ? "dark" : "light") : normalized;
};

const completePlayerTheme = (
  theme: PlayerThemeName,
  ...sources: (Partial<PlayerColorTheme> | null | undefined)[]
): PlayerColorTheme => ({
  ...PLAYER_COLOR_PRESETS[theme],
  ...mergePresent<PlayerColorTheme>(...sources),
});

const completeVideoTheme = (...sources: (Partial<VideoColorTheme> | null | undefined)[]): VideoColorTheme => ({
  ...VIDEO_COLOR_PRESET,
  ...mergePresent<VideoColorTheme>(...sources),
});

const playerThemeFromApi = (value: Record<string, unknown> | undefined): Partial<PlayerColorTheme> => {
  const result: Partial<PlayerColorTheme> = {};
  for (const key of PLAYER_COLOR_KEYS) {
    const apiKey = PLAYER_API_KEYS[key];
    const candidate = value?.[apiKey] ?? value?.[key];
    if (candidate !== undefined && candidate !== null) { result[key] = candidate as string; }
  }
  return result;
};

const videoThemeFromApi = (value: Record<string, unknown> | undefined): Partial<VideoColorTheme> => {
  const result: Partial<VideoColorTheme> = {};
  for (const key of VIDEO_COLOR_KEYS) {
    const apiKey = VIDEO_API_KEYS[key];
    const candidate = value?.[apiKey] ?? value?.[key];
    if (candidate !== undefined && candidate !== null) { result[key] = candidate as string; }
  }
  return result;
};

// Shared deserialization for /player settings and adverts. It mirrors the
// player_settings contract: old top-level agent/accent values fill both
// palettes only when their nested equivalent is absent.
const asRecord = (value: unknown): Record<string, unknown> | undefined => (
  value && typeof value === "object" ? value as Record<string, unknown> : undefined
);

const palettesFromApi = (settings: Record<string, unknown> = {}) => {
  const legacy = {
    agentColor: settings.agent_color as string | undefined,
    accentColor: settings.accent_color as string | undefined,
    accentTextColor: settings.accent_text_color as string | undefined,
  };

  return {
    lightTheme: completePlayerTheme("light", legacy, playerThemeFromApi(asRecord(settings.light_theme))),
    darkTheme: completePlayerTheme("dark", legacy, playerThemeFromApi(asRecord(settings.dark_theme))),
    videoTheme: completeVideoTheme(videoThemeFromApi(asRecord(settings.video_theme))),
  };
};

// These serializers are exported for the management API client/backend to use
// when it is housed alongside this package. Values are copied, never parsed.
const themeToApi = (theme: PlayerColorTheme): Record<string, string> => Object.fromEntries(
  PLAYER_COLOR_KEYS.map((key) => [PLAYER_API_KEYS[key], theme[key]])
);

const videoThemeToApi = (theme: VideoColorTheme): Record<string, string> => Object.fromEntries(
  VIDEO_COLOR_KEYS.map((key) => [VIDEO_API_KEYS[key], theme[key]])
);

const palettesToApi = ({
  theme,
  lightTheme,
  darkTheme,
  videoTheme,
}: {
  theme: PlayerThemePreference;
  lightTheme: PlayerColorTheme;
  darkTheme: PlayerColorTheme;
  videoTheme: VideoColorTheme;
}) => ({
  theme: normalizeThemePreference(theme),
  light_theme: themeToApi(lightTheme),
  dark_theme: themeToApi(darkTheme),
  video_theme: videoThemeToApi(videoTheme),
});

export {
  completePlayerTheme,
  completeVideoTheme,
  mergePresent,
  normalizeThemePreference,
  palettesFromApi,
  palettesToApi,
  playerThemeFromApi,
  resolveThemePreference,
  themeToApi,
  videoThemeFromApi,
  videoThemeToApi,
};
