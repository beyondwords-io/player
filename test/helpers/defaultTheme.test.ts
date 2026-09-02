import { contrastRatio, clampContrast, mix, compositeOver, toAlphaString, luminance } from "../../src/helpers/default_theme/colorMath";
import deriveTokens, { parseAgentColor, scaleRadius } from "../../src/helpers/default_theme/deriveTokens";
import {
  PLAYER_COLOR_PRESETS,
  VIDEO_COLOR_PRESET,
  completePlayerTheme,
  normalizeThemePreference,
  palettesFromApi,
  palettesToApi,
  resolveThemePreference,
  themeToApi,
  videoThemeToApi,
} from "../../src/helpers/default_theme/palettes";

describe("colorMath", () => {
  it("retains colour utilities for internal effects and accessibility checks", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(luminance("white")).toBeCloseTo(1, 1);
    expect(toAlphaString("rgba(0, 0, 0, 0.8)", 0.1)).toEqual("rgba(0, 0, 0, 0.1)");
    expect(clampContrast("#212121", "#f5f5f5", 4.5)).toEqual("#212121");
    expect(compositeOver("rgba(0, 0, 0, 0.5)", "#ffffff")).toEqual("#808080");
    expect(mix("#000000", "#ffffff", 0.5)).toEqual("#808080");
  });
});

describe("literal palette contract", () => {
  it("contains the approved complete Light, Dark, and Video presets", () => {
    expect(PLAYER_COLOR_PRESETS.light).toEqual({
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
    });
    expect(PLAYER_COLOR_PRESETS.dark).toMatchObject({
      backgroundColor: "#212121",
      textColor: "#fafafa",
      secondaryTextColor: "#989898",
      iconColor: "#fafafa",
      subtleColor: "rgba(250, 250, 250, 0.18)",
      linkColor: "#af6cfd",
      accentColor: "#373737",
      accentTextColor: "#fafafa",
    });
    expect(VIDEO_COLOR_PRESET).toEqual({
      backgroundColor: "#000000",
      textColor: "#ffffff",
      iconColor: "#ffffff",
      subtleColor: "rgba(255, 255, 255, 0.3)",
    });
  });

  it("merges per field and treats empty or invalid CSS as opaque values", () => {
    expect(completePlayerTheme("light", { textColor: "", backgroundColor: "not-css" })).toMatchObject({
      textColor: "",
      backgroundColor: "not-css",
      iconColor: "#212121",
    });
  });

  it("applies named SDK, deprecated flat SDK, API, then preset precedence", () => {
    const theme = completePlayerTheme(
      "light",
      { textColor: "api-text", iconColor: "api-icon", linkColor: "api-link" },
      { textColor: "flat-text", iconColor: "flat-icon" },
      { textColor: "named-text" },
    );

    expect(theme).toMatchObject({
      textColor: "named-text",
      iconColor: "flat-icon",
      linkColor: "api-link",
      subtleColor: PLAYER_COLOR_PRESETS.light.subtleColor,
    });
  });

  it("materializes older API responses and applies legacy agent/accent fields to both palettes", () => {
    const palettes = palettesFromApi({
      agent_color: "#111,#eee",
      accent_color: "low-contrast",
      accent_text_color: "also-low-contrast",
      light_theme: { text_color: "#111", agent_color: "nested-wins" },
      video_theme: { background_color: "video-invalid" },
    });

    expect(palettes.lightTheme).toMatchObject({ textColor: "#111", agentColor: "nested-wins", accentColor: "low-contrast" });
    expect(palettes.darkTheme).toMatchObject({ textColor: "#fafafa", agentColor: "#111,#eee", accentTextColor: "also-low-contrast" });
    expect(palettes.videoTheme).toMatchObject({ backgroundColor: "video-invalid", subtleColor: VIDEO_COLOR_PRESET.subtleColor });
  });

  it("serializes every field without normalizing values", () => {
    const player = { ...PLAYER_COLOR_PRESETS.light, textColor: "#111", agentColor: "bad(css" };
    const video = { ...VIDEO_COLOR_PRESET, subtleColor: "" };

    expect(themeToApi(player)).toMatchObject({ text_color: "#111", agent_color: "bad(css", secondary_text_color: "#6d6d6d" });
    expect(videoThemeToApi(video)).toEqual({ background_color: "#000000", text_color: "#ffffff", icon_color: "#ffffff", subtle_color: "" });
  });

  it("round-trips all player_settings colour fields exactly", () => {
    const light = {
      backgroundColor: "invalid background",
      textColor: "#111",
      secondaryTextColor: "#eee",
      iconColor: "var(--publisher-icon)",
      subtleColor: "rgba(1, 2, 3, 0.0001)",
      linkColor: "same-as-background",
      highlightColor: "linear-gradient(1deg, red, blue)",
      wordHighlightColor: "transparent",
      agentColor: "linear-gradient(20deg, rgb(1, 2, 3), #eee)",
      accentColor: "accent-invalid",
      accentTextColor: "accent-text-invalid",
    };
    const dark = { ...light, backgroundColor: "dark-invalid", agentColor: "#111,#eee" };
    const video = { backgroundColor: "video-invalid", textColor: "#fff0", iconColor: "currentColor", subtleColor: "" };
    const payload = palettesToApi({ theme: "auto", lightTheme: light, darkTheme: dark, videoTheme: video });
    const result = palettesFromApi(payload);

    expect(payload.theme).toEqual("auto");
    expect(result).toEqual({ lightTheme: light, darkTheme: dark, videoTheme: video });
  });

  it("supports Light, Dark, Auto, and the deprecated custom alias", () => {
    expect(resolveThemePreference("auto", false)).toEqual("light");
    expect(resolveThemePreference("auto", true)).toEqual("dark");
    expect(normalizeThemePreference("custom")).toEqual("light");
  });

  it("keeps the approved text roles accessible in both presets", () => {
    for (const palette of Object.values(PLAYER_COLOR_PRESETS)) {
      expect(contrastRatio(palette.textColor, palette.backgroundColor)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.secondaryTextColor, palette.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("parseAgentColor", () => {
  it("passes literal CSS through and translates only the deprecated comma format", () => {
    const gradient = "linear-gradient(120deg, rgba(1, 2, 3, .4), #eee)";
    expect(parseAgentColor("#0053a8").css).toEqual("#0053a8");
    expect(parseAgentColor(gradient).css).toEqual(gradient);
    expect(parseAgentColor("#943bfc,#e23ad0").css).toEqual("linear-gradient(100deg, #943bfc, #e23ad0)");
    expect(parseAgentColor("rgba(1, 2, 3, .4), rgb(4, 5, 6)").css)
      .toEqual("linear-gradient(100deg, rgba(1, 2, 3, .4), rgb(4, 5, 6))");
    expect(parseAgentColor("invalid-css").css).toEqual("invalid-css");
  });
});

describe("scaleRadius", () => {
  it("scales and bounds the radius family", () => {
    expect(scaleRadius(8)).toEqual({ bar: "8px", control: "6px", bubble: "10px", track: "4px" });
    expect(scaleRadius(0)).toEqual({ bar: "0px", control: "3px", bubble: "4px", track: "0px" });
    expect(scaleRadius(99).bar).toEqual("16px");
  });
});

describe("deriveTokens", () => {
  it("maps consolidated literal roles without clamping or substitution", () => {
    const palette = {
      backgroundColor: "invalid-background",
      textColor: "#111",
      secondaryTextColor: "#eee",
      iconColor: "same-as-background",
      subtleColor: "quiet-border",
      linkColor: "literal-link",
      highlightColor: "section-mark",
      wordHighlightColor: "word-mark",
      agentColor: "agent-paint",
      accentColor: "user-bubble",
      accentTextColor: "user-copy",
    };
    const tokens = deriveTokens({ palette });

    expect(tokens).toMatchObject({
      background: "invalid-background",
      text: "#111",
      secondary: "#eee",
      muted: "#eee",
      icon: "same-as-background",
      subtle: "quiet-border",
      divider: "quiet-border",
      track: "quiet-border",
      skeleton: "quiet-border",
      citationBorder: "quiet-border",
      link: "literal-link",
      citation: "literal-link",
      underline: "literal-link",
      highlight: "section-mark",
      wordHighlight: "word-mark",
      orb: "agent-paint",
      bubbleBackground: "user-bubble",
      bubbleText: "user-copy",
      sendBackground: "#111",
      sendIcon: "invalid-background",
    });
  });

  it("keeps hover and pressed as 5% and 10% internal effects", () => {
    const tokens = deriveTokens({ palette: { textColor: "#111" } });
    expect(tokens.hover).toEqual("rgba(17, 17, 17, 0.05)");
    expect(tokens.pressed).toEqual("rgba(17, 17, 17, 0.1)");
  });

  it("uses every literal video role including background", () => {
    const tokens = deriveTokens({ videoTheme: {
      backgroundColor: "video-bg",
      textColor: "video-copy",
      iconColor: "video-icon",
      subtleColor: "video-track",
    } });
    expect(tokens).toMatchObject({
      videoBackground: "video-bg",
      videoText: "video-copy",
      videoIcon: "video-icon",
      videoSubtle: "video-track",
    });
  });
});
