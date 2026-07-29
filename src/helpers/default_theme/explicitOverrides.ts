// Colour props that still hold the legacy Player.svelte defaults were not set
// by the publisher or the API, so the theme preset should win for the default
// player style. Anything else is an explicit override.
const LEGACY_DEFAULTS = {
  textColor: "#111",
  backgroundColor: "#f5f5f5",
  iconColor: "rgba(0, 0, 0, 0.8)",
  highlightColor: "#eee",
  videoTextColor: "white",
  videoIconColor: "white",
};

const explicitOverrides = (props) => {
  const overrides = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === "") { continue; }
    if (key in LEGACY_DEFAULTS && value === LEGACY_DEFAULTS[key]) { continue; }

    overrides[key] = value;
  }

  return overrides;
};

export default explicitOverrides;
export { LEGACY_DEFAULTS };
