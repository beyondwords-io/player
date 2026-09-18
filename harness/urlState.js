// The URL is the repro. Identifiers are their own params, and each changed
// setting is a set=key:value pair, encoded by src/helpers/settingUrl.ts.
//
// Plain ES module, no imports: this page also runs against the published
// bundle from a static host, where the src/ helpers are not available.

const identifierKeys = ["projectId", "contentId", "playlistId", "sourceId", "sourceUrl", "previewToken", "playerApiUrl"];

// Params this page used to take at the top level, kept working as settings.
const legacyKeys = ["playerStyle", "widgetStyle", "embedMode", "widgetEmbedMode", "theme"];

const decodeSettingValue = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    // A bare string, e.g. set=theme:dark or set=agentName:Zoe
    return raw;
  }
};

const decodeUrlState = (search) => {
  const params = new URLSearchParams(search);
  const identifiers = {};
  const settings = {};

  identifierKeys.forEach((key) => {
    const value = params.get(key);
    if (value) { identifiers[key] = value; }
  });

  legacyKeys.forEach((key) => {
    const value = params.get(key);
    if (value) { settings[key] = value; }
  });

  if (params.get("video") === "true") { settings.video = true; }
  if (params.get("videoSize")) { settings.videoSizes = [params.get("videoSize")]; }

  params.getAll("set").forEach((pair) => {
    // Split on the first colon only, so a value can contain one.
    const colon = pair.indexOf(":");
    if (colon === -1) { return; }

    settings[pair.slice(0, colon)] = decodeSettingValue(pair.slice(colon + 1));
  });

  return { identifiers, settings, advanced: params.get("advanced") === "true" };
};

export default decodeUrlState;
export { decodeUrlState, decodeSettingValue, identifierKeys };
