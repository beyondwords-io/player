import { contrastRatio, clampContrast, mix, toAlphaString, luminance } from "../../src/helpers/default_theme/colorMath";
import deriveTokens, { parseAgentColor, scaleRadius } from "../../src/helpers/default_theme/deriveTokens";

describe("colorMath", () => {
  it("computes WCAG contrast ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 1);
  });

  it("parses named colors, short hex and rgba strings", () => {
    expect(luminance("white")).toBeCloseTo(1, 1);
    expect(contrastRatio("#fff", "black")).toBeCloseTo(21, 0);
    expect(toAlphaString("rgba(0, 0, 0, 0.8)", 0.1)).toEqual("rgba(0, 0, 0, 0.1)");
  });

  it("leaves passing colors unchanged", () => {
    expect(clampContrast("#212121", "#f5f5f5", 4.5)).toEqual("#212121");
  });

  it("clamps the spec's worked example to a passing tint of the same hue", () => {
    // The spec quotes #f3e8ff = 5.1:1 for this pair, but that colour is
    // actually 4.15:1 under WCAG math, so the clamp walks one step further.
    const clamped = clampContrast("#b06ef7", "#943bfc", 4.5);

    expect(contrastRatio(clamped, "#943bfc")).toBeGreaterThanOrEqual(4.5);
    expect(clamped).toEqual(mix("#b06ef7", "#ffffff", 0.95));
  });

  it("falls back to pure black or white when nothing passes", () => {
    expect(clampContrast("#808080", "#808080", 21)).toEqual("#ffffff");
  });
});

describe("parseAgentColor", () => {
  it("renders one hex as a solid and two as a gradient", () => {
    expect(parseAgentColor("#0053a8").css).toEqual("#0053a8");
    expect(parseAgentColor("#943bfc,#e23ad0").css).toEqual("linear-gradient(100deg, #943bfc, #e23ad0)");
    expect(parseAgentColor(["#943bfc", "#e23ad0"]).css).toContain("linear-gradient");
  });

  it("defaults to the BeyondWords gradient start when unset or invalid", () => {
    expect(parseAgentColor(undefined).from).toEqual("#943bfc");
    expect(parseAgentColor("not-a-color").from).toEqual("#943bfc");
  });
});

describe("scaleRadius", () => {
  it("scales the family from one knob", () => {
    expect(scaleRadius(8)).toEqual({ bar: "8px", control: "6px", bubble: "10px", track: "4px" });
  });

  it("applies floors at the small end and clamps the range", () => {
    expect(scaleRadius(0)).toEqual({ bar: "0px", control: "3px", bubble: "4px", track: "0px" });
    expect(scaleRadius(99).bar).toEqual("16px");
    expect(scaleRadius("nonsense").bar).toEqual("8px");
  });
});

describe("deriveTokens", () => {
  it("fills every colour from the light preset by default", () => {
    const tokens = deriveTokens();

    expect(tokens.background).toEqual("#f5f5f5");
    expect(tokens.text).toEqual("#212121");
    expect(tokens.isDark).toEqual(false);
    expect(tokens.orb).toEqual("linear-gradient(100deg, #943bfc, #e23ad0)");
    expect(tokens.bubbleBackground).toEqual("#ffffff");
  });

  it("highlights with lime, easing the word mark off on dark so text stays legible", () => {
    const light = deriveTokens();
    const dark = deriveTokens({ theme: "dark" });

    expect(light.highlight).toEqual("rgba(164, 255, 0, 0.2)");
    expect(light.wordHighlight).toEqual("rgba(164, 255, 0, 0.8)");
    expect(dark.highlight).toEqual("rgba(164, 255, 0, 0.2)");
    expect(dark.wordHighlight).toEqual("rgba(164, 255, 0, 0.4)");
  });

  it("lets a publisher's own highlight colours win", () => {
    const tokens = deriveTokens({ overrides: { highlightColor: "#A4FF0044", wordHighlightColor: "#0053a8" } });

    expect(tokens.highlight).toEqual("#A4FF0044");
    expect(tokens.wordHighlight).toEqual("#0053a8");
  });

  it("flips neutral tints on the dark preset", () => {
    const tokens = deriveTokens({ theme: "dark" });

    expect(tokens.isDark).toEqual(true);
    expect(tokens.divider).toEqual("rgba(250, 250, 250, 0.15)");
    expect(tokens.track).toEqual("rgba(250, 250, 250, 0.2)");
    expect(tokens.orb).toEqual("linear-gradient(100deg, #943bfc, #e23ad0)"); // the orb never re-themes
  });

  it("applies explicit overrides on top of the preset", () => {
    const tokens = deriveTokens({ overrides: { backgroundColor: "#e3f1ff", textColor: "#002852", iconColor: "#0053a8" } });

    expect(tokens.background).toEqual("#e3f1ff");
    expect(tokens.text).toEqual("#002852");
    expect(tokens.icon).toEqual("#0053a8");
  });

  it("clamps illegible pairs rather than rendering them", () => {
    const tokens = deriveTokens({ overrides: { backgroundColor: "#943bfc", textColor: "#b06ef7", iconColor: "#a45cf9" } });

    expect(contrastRatio(tokens.text, tokens.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens.icon, tokens.background)).toBeGreaterThanOrEqual(3);
  });

  it("adds the white ring when the background nears the orb colour", () => {
    expect(deriveTokens({ overrides: { backgroundColor: "#943bfc" } }).orbRing).toContain("1px");
    expect(deriveTokens().orbRing).toEqual("none");
  });

  it("derives citation and link tints from textColor when an avatar replaces the orb", () => {
    const withAvatar = deriveTokens({ overrides: { agentAvatar: "https://example.com/mark.png" } });
    const withoutAvatar = deriveTokens();

    expect(withAvatar.hasAvatar).toEqual(true);
    expect(withAvatar.citation).toEqual(withAvatar.bubbleText);
    expect(withoutAvatar.citation).not.toEqual(withoutAvatar.bubbleText);
  });

  it("keeps the accent pair legible whatever the publisher sets", () => {
    const tokens = deriveTokens({ overrides: { accentColor: "#ffee00", accentTextColor: "#fffbcc" } });

    expect(contrastRatio(tokens.bubbleText, tokens.bubbleBackground)).toBeGreaterThanOrEqual(4.5);
  });

  it("ignores invalid backgrounds and unset overrides", () => {
    const tokens = deriveTokens({ overrides: { backgroundColor: "nonsense", textColor: undefined } });

    expect(tokens.background).toEqual("#f5f5f5");
    expect(tokens.backgroundBase).toEqual("#f5f5f5");
    expect(tokens.text).toEqual("#212121");
  });

  it("paints a gradient background while measuring its first colour stop", () => {
    const gradient = "linear-gradient(90deg, #212121, #444444)";
    const tokens = deriveTokens({ overrides: { backgroundColor: gradient } });

    expect(tokens.background).toEqual(gradient);
    expect(tokens.backgroundBase).toEqual("#212121");
    expect(tokens.isDark).toEqual(true); // derivations flip for the dark stop
    expect(contrastRatio(tokens.text, tokens.backgroundBase)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps rgba and named colour stops measurable", () => {
    expect(deriveTokens({ overrides: { backgroundColor: "radial-gradient(rgba(20, 20, 20, 1), #fff)" } }).backgroundBase)
      .toEqual("rgba(20, 20, 20, 1)");
    expect(deriveTokens({ overrides: { backgroundColor: "linear-gradient(white, #eee)" } }).isDark).toEqual(false);
  });
});
