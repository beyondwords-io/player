const NAMED_COLORS = {
  white: "#ffffff",
  black: "#000000",
  transparent: "#00000000",
};

const parseColor = (value) => {
  if (typeof value !== "string") { return null; }

  const named = NAMED_COLORS[value.trim().toLowerCase()];
  const str = (named || value).trim();

  const hexMatch = str.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) { return parseHex(hexMatch[1]); }

  const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (rgbMatch) {
    return {
      r: Math.min(255, parseFloat(rgbMatch[1])),
      g: Math.min(255, parseFloat(rgbMatch[2])),
      b: Math.min(255, parseFloat(rgbMatch[3])),
      a: rgbMatch[4] === undefined ? 1 : Math.min(1, parseFloat(rgbMatch[4])),
    };
  }

  return null;
};

const parseHex = (hex) => {
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6 && hex.length !== 8) { return null; }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
  };
};

const toHex = ({ r, g, b }) => {
  const part = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
};

const toAlphaString = (color, alpha) => {
  const rgb = parseColor(color);
  if (!rgb) { return color; }
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;
};

// WCAG relative luminance.
const luminance = (color) => {
  const rgb = parseColor(color);
  if (!rgb) { return 0; }

  const channel = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
};

const contrastRatio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const mix = (from, to, t) => {
  const a = parseColor(from);
  const b = parseColor(to);
  if (!a || !b) { return from; }

  return toHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
};

// Moves fg toward black or white in 5% steps until it passes the contrast
// floor against bg, per the design system builder's reference implementation.
const clampContrast = (fg, bg, floor) => {
  if (!parseColor(fg)) { return fg; }
  if (contrastRatio(fg, bg) >= floor) { return fg; }

  const target = luminance(bg) > 0.4 ? "#000000" : "#ffffff";

  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const candidate = mix(fg, target, t);
    if (contrastRatio(candidate, bg) >= floor) { return candidate; }
  }

  return target;
};

const GRADIENT = /^\s*(repeating-)?(linear|radial|conic)-gradient\(/i;

const isGradient = (value) => typeof value === "string" && GRADIENT.test(value);

// The first colour stop stands in for a gradient when something needs a single
// measurable colour (luminance, contrast clamping).
const firstColorStop = (value) => {
  if (typeof value !== "string") { return null; }

  const match = value.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/i);
  if (match) { return match[0]; }

  const named = value.match(/\b(white|black)\b/i);
  return named ? named[0].toLowerCase() : null;
};

export { parseColor, toAlphaString, luminance, contrastRatio, mix, clampContrast, isGradient, firstColorStop };
