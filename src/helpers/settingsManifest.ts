import playerStyles from "./playerStyles";

// Every player setting, described once, so the control panel is a loop over
// data rather than a hand-maintained list of inputs that drifts from the props.
// test/helpers/settingsManifest.test.ts checks this against Player.svelte.
//
//   key        the prop name, which is also the label
//   group      panel section, in the order the groups are declared below
//   control    select | text | number | json
//   options    array, or a function of { content, adverts, introsOutros, videoSizes }
//   format     value -> the string shown in the control
//   parse      the control's string -> the value to set (undefined means "cleared")
//   default    the Player.svelte default, so a reset can restore it
//   cleared    what an emptied control stores; null unless stated, never undefined
//   api        the /player settings key that feeds it, for reference
//   refetch    changing it changes the API request, so re-request the content
//   appliesTo  dimmed when the current playerStyle cannot show it
//   needs      why a setting might look like it is doing nothing
//   transient  apply it, but do not record it as an override (playback state)
//   readOnly   no control; surfaced by the inspector where useful
//   loader     part of the content loader form, not the settings list
//   presets    named values to start a hand-typed setting from
//   advanced   hidden until advanced settings are shown

const bool = [false, true];
const sections = ["all", "body", "none", "all-none", "none-all"];

const csv = {
  format: (value) => (value || []).join(","),
  parse: (raw) => (raw ? raw.split(",") : []),
};

const number = (dflt) => ({
  control: "number",
  default: dflt,
  cleared: dflt,
  parse: (raw) => (raw === "" ? undefined : Number(raw)),
});

const indexOptions = (key) => ({ [key]: items }) => [-1, ...(items || []).map((_item, index) => index)];
const indexLabel = (key) => (value, ctx) => {
  const item = ctx?.[key]?.[value];
  if (value === -1) { return "-1 (none)"; }

  return `${value}${item ? ` (${item.placement || item.title || ""})` : ""}`;
};

const settingsManifest = [
  // Content: applied together by the Fetch button, so the request is never a
  // mix of a new project id and a stale playlist id.
  { key: "projectId", group: "Content", control: "text", default: undefined, cleared: null, loader: true, refetch: true },
  { key: "contentId", group: "Content", control: "text", default: undefined, cleared: null, loader: true, refetch: true },
  { key: "playlistId", group: "Content", control: "text", default: undefined, cleared: null, loader: true, refetch: true },
  { key: "sourceId", group: "Content", control: "text", default: undefined, cleared: null, loader: true, refetch: true },
  { key: "sourceUrl", group: "Content", control: "text", default: undefined, cleared: null, loader: true, refetch: true },
  { key: "previewToken", group: "Content", control: "text", default: undefined, cleared: null, loader: true, refetch: true, needs: "unpublished content" },
  { key: "playerApiUrl", group: "Content", control: "text", default: "https://api.beyondwords.io/v1/projects/{id}/player", cleared: null, loader: true, refetch: true },
  { key: "playlist", group: "Content", control: "json", default: [], cleared: [], loader: true, advanced: true, refetch: true, needs: "an array of identifier objects" },
  { key: "content", group: "Content", readOnly: true, default: [] },

  { key: "playerStyle", group: "Style", control: "select", options: playerStyles, default: "standard", api: "player_style", refetch: true, needs: "video content when set to video" },
  { key: "video", group: "Style", control: "select", options: bool, default: false, appliesTo: "default", refetch: true, needs: "content with a video variant" },
  { key: "videoSizes", group: "Style", control: "select", default: [], refetch: true, ...csv,
    options: ({ videoSizes }) => ["", ...videoSizes], format: (value) => value?.[0] || "auto (first match)", parse: (raw) => (raw ? [raw] : []) },
  { key: "theme", group: "Style", control: "select", options: ["light", "dark", "custom"], default: "light", appliesTo: "default" },
  { key: "radius", group: "Style", ...number(8), appliesTo: "default" },
  { key: "textColor", group: "Style", control: "text", default: "#111", api: "text_color" },
  { key: "backgroundColor", group: "Style", control: "text", default: "#f5f5f5", api: "background_color" },
  { key: "iconColor", group: "Style", control: "text", default: "rgba(0, 0, 0, 0.8)", api: "icon_color" },
  { key: "accentColor", group: "Style", control: "text", default: undefined, appliesTo: "default", needs: "the chat panel" },
  { key: "accentTextColor", group: "Style", control: "text", default: undefined, appliesTo: "default", needs: "the chat panel" },
  { key: "logoIconEnabled", group: "Style", control: "select", options: bool, default: true, api: "logo_icon_enabled" },
  { key: "videoTextColor", group: "Style", control: "text", default: "white", api: "video_theme.text_color", advanced: true, needs: "video" },
  { key: "videoBackgroundColor", group: "Style", control: "text", default: "black", api: "video_theme.background_color", advanced: true, needs: "video" },
  { key: "videoIconColor", group: "Style", control: "text", default: "white", api: "video_theme.icon_color", advanced: true, needs: "video" },

  { key: "playbackState", group: "Playback", control: "select", options: ["stopped", "playing", "paused"], default: "stopped", transient: true },
  { key: "currentTime", group: "Playback", ...number(0), transient: true },
  { key: "duration", group: "Playback", ...number(0), transient: true, api: "audio.duration" },
  { key: "playbackRate", group: "Playback", ...number(1), transient: true },
  { key: "playbackRates", group: "Playback", control: "json", default: [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 2, 2.5, 3], cleared: [], advanced: true },
  { key: "contentIndex", group: "Playback", control: "select", default: 0, transient: true,
    options: ({ content }) => (content || []).map((_item, index) => index), format: (value) => `${value}` },
  { key: "summary", group: "Playback", control: "select", options: bool, default: false, refetch: true, needs: "content with a summary" },
  { key: "variants", group: "Playback", control: "select", default: [], appliesTo: "default", ...csv,
    options: ["", "full", "summary", "full,summary"], format: (value) => (value || []).join(",") || "all available" },
  { key: "playerTitle", group: "Playback", control: "text", default: undefined, cleared: null, api: "player_title" },
  { key: "titleEnabled", group: "Playback", control: "select", options: bool, default: true, api: "title_enabled" },
  { key: "callToAction", group: "Playback", control: "text", default: undefined, cleared: null, api: "call_to_action" },
  { key: "skipButtonStyle", group: "Playback", control: "select", default: "auto", api: "skip_button_style",
    options: ["auto", "segments", "seconds", "seconds-15", "seconds-15-30", "tracks"] },
  { key: "downloadFormats", group: "Playback", control: "select", default: [], api: "download_button_enabled", ...csv,
    options: ["", "mp3", "mp4", "mp3,mp4"], format: (value) => (value || []).join(",") || "none", needs: "playback: hidden while stopped" },
  { key: "playerLanguage", group: "Playback", control: "text", default: undefined, cleared: null, advanced: true,
    needs: "a supported locale code, e.g. fr; unsupported codes warn and fall back to the browser" },
  { key: "durationFormat", group: "Playback", control: "select", options: ["", "auto", "hh:mm:ss", "seconds"], default: undefined, cleared: null, advanced: true,
    parse: (raw) => raw || null, format: (value) => value || "auto (default)" },
  { key: "continuousPlaybackMode", group: "Playback", control: "select", options: ["auto", "none"], default: "auto", refetch: true },
  { key: "mediaSession", group: "Playback", control: "select", options: ["auto", "override", "none"], default: "auto", advanced: true },
  { key: "loadedMedia", group: "Playback", readOnly: true, default: undefined },
  { key: "currentSegment", group: "Playback", readOnly: true, default: undefined },
  { key: "hoveredSegment", group: "Playback", readOnly: true, default: undefined },

  // The tier is requested, then echoed back by the API, so the two can differ.
  { key: "accessTier", group: "Access", control: "text", default: undefined, cleared: null, api: "access_tier", refetch: true, needs: "a project with access tiers" },
  { key: "segmentLimit", group: "Access", control: "select", default: undefined, cleared: null, api: "segment_limit",
    options: [null, 0, 2, 5], format: (value) => (value === null || value === undefined ? "full access" : `${value}${value === 0 ? " (title only)" : " (preview)"}`),
    parse: (raw) => (raw === "" || raw === "null" ? null : Number(raw)), needs: "normally served by the project's access tier" },
  { key: "accessCtaText", group: "Access", control: "text", default: undefined, cleared: null, appliesTo: "default" },
  { key: "accessCtaUrl", group: "Access", control: "text", default: undefined, cleared: null, appliesTo: "default" },

  { key: "embedMode", group: "Agent", control: "select", options: ["audio", "audio-agent", "agent"], default: "audio", appliesTo: "default" },
  { key: "agentAccess", group: "Agent", control: "select", options: ["full", "limited", "locked", "off"], default: "full", appliesTo: "default", needs: "an embedMode other than audio" },
  { key: "agentLimit", group: "Agent", control: "text", default: undefined, cleared: null, appliesTo: "default", needs: "agentAccess: limited" },
  { key: "agentVoice", group: "Agent", control: "select", options: bool, default: true, appliesTo: "default" },
  { key: "agentName", group: "Agent", control: "text", default: undefined, cleared: null, appliesTo: "default" },
  { key: "agentPlaceholder", group: "Agent", control: "text", default: undefined, cleared: null, appliesTo: "default" },
  // Type your own, separated by a pipe, or start from a preset. Pipes rather
  // than commas because these are sentences.
  { key: "shortcuts", group: "Agent", control: "text", default: [], cleared: [], appliesTo: "default",
    format: (value) => (value || []).join(" | "),
    parse: (raw) => raw.split("|").map((phrase) => phrase.trim()).filter((phrase) => phrase),
    presets: {
      "3 news examples": ["What are today's headlines?", "Catch me up on this story", "What's new in my topics?"],
      "2 sport examples": ["How did the match end?", "Who scored?"],
      "1 long example": ["Explain the background to this story as if I have not been following it"],
      "none": [],
    } },
  { key: "agentCtaText", group: "Agent", control: "text", default: undefined, cleared: null, appliesTo: "default", needs: "agentAccess locked or a spent limit; falls back to accessCtaText" },
  { key: "agentCtaUrl", group: "Agent", control: "text", default: undefined, cleared: null, appliesTo: "default", needs: "falls back to accessCtaUrl" },
  { key: "agentColor", group: "Agent", control: "text", default: undefined, cleared: null, appliesTo: "default" },
  { key: "agentAvatar", group: "Agent", control: "text", default: undefined, cleared: null, appliesTo: "default" },

  { key: "playlistStyle", group: "Playlist", control: "select", options: ["auto-5-4", "auto", "show", "show-3", "show-999", "hide"], default: "auto-5-4", needs: "playlist content" },
  { key: "playlistToggle", group: "Playlist", control: "select", options: ["auto", "show", "hide"], default: "auto", needs: "playlist content" },

  { key: "widgetStyle", group: "Widget", control: "select", options: ["auto", ...playerStyles, "none"], default: "standard", api: "widget_style" },
  { key: "widgetEmbedMode", group: "Widget", control: "select", options: ["auto", "audio", "audio-agent", "agent"], default: "auto", appliesTo: "default" },
  { key: "widgetPosition", group: "Widget", control: "select", options: ["auto", "left", "center", "right"], default: "auto", api: "widget_position" },
  { key: "widgetWidth", group: "Widget", control: "select", options: ["auto", "400px", "30rem", "fit-content", "initial", "0"], default: "auto" },
  { key: "widgetMargin", group: "Widget", control: "select", options: ["16px", "32px", "32px 16px", "10px 20px 30px 40px"], default: "16px" },
  { key: "showBottomWidget", group: "Widget", control: "select", options: bool, default: false, needs: "normally elected by scrolling past the player" },
  { key: "showCloseWidget", group: "Widget", control: "select", options: bool, default: true },
  { key: "widgetTarget", group: "Widget", control: "text", default: undefined, cleared: null, advanced: true },

  { key: "highlightColor", group: "Highlighting", control: "text", default: "#eee", api: "highlight_color" },
  { key: "wordHighlightsEnabled", group: "Highlighting", control: "select", options: bool, default: false, api: "word_highlights_enabled", refetch: true,
    needs: "word timings, which are only requested when this is on at fetch time" },
  { key: "wordHighlightColor", group: "Highlighting", control: "text", default: undefined, cleared: null, api: "word_highlight_color" },
  { key: "highlightSections", group: "Highlighting", control: "select", options: sections, default: "all", api: "segment_highlights_enabled", needs: "segments in the page" },
  { key: "clickableSections", group: "Highlighting", control: "select", options: sections, default: "all", api: "segment_playback_enabled", needs: "segments in the page" },
  { key: "segmentWidgetSections", group: "Highlighting", control: "select", options: sections, default: "body", advanced: true },
  { key: "segmentWidgetPosition", group: "Highlighting", control: "select", default: "7-oclock", advanced: true,
    options: Array.from({ length: 12 }, (_unused, index) => `${index + 1}-oclock`) },

  { key: "infoText", group: "Attribution", control: "text", default: undefined, cleared: null, appliesTo: "default" },
  { key: "disclosureText", group: "Attribution", control: "text", default: undefined, cleared: null, appliesTo: "default" },
  { key: "disclosureLink", group: "Attribution", control: "text", default: undefined, cleared: null, appliesTo: "default" },

  { key: "advertIndex", group: "Adverts", control: "select", default: -1, transient: true,
    options: indexOptions("adverts"), format: indexLabel("adverts"), parse: (raw) => Number(raw) },
  { key: "persistentIndex", group: "Adverts", control: "select", default: -1, transient: true,
    options: indexOptions("adverts"), format: indexLabel("adverts"), parse: (raw) => Number(raw) },
  { key: "introsOutrosIndex", group: "Adverts", control: "select", default: -1, transient: true,
    options: indexOptions("introsOutros"), format: indexLabel("introsOutros"), parse: (raw) => Number(raw) },
  { key: "persistentAdImage", group: "Adverts", control: "select", options: bool, default: false, api: "persistent_ad_image" },
  { key: "outroPlaybackMode", group: "Adverts", control: "select", options: ["after-all", "after-each"], default: "after-all", api: "outro_playback_mode" },
  { key: "preloadAdvertIndex", group: "Adverts", ...number(-1), advanced: true },
  { key: "minDurationForMidroll", group: "Adverts", ...number(2 * 60), advanced: true },
  { key: "minTimeUntilEndForMidroll", group: "Adverts", ...number(10), advanced: true },
  { key: "advertConsent", group: "Adverts", control: "select", default: "personalized", advanced: true,
    options: ["personalized", "non-personalized", "under-the-age-of-consent"] },
  { key: "adverts", group: "Adverts", readOnly: true, default: [] },
  { key: "introsOutros", group: "Adverts", readOnly: true, default: [], api: "intros_outros" },

  { key: "analyticsConsent", group: "Analytics", control: "select", options: ["allowed", "without-local-storage", "none"], default: "allowed", api: "analytics_enabled", advanced: true },
  { key: "analyticsCustomUrl", group: "Analytics", control: "text", default: undefined, cleared: null, api: "analytics_custom_url", advanced: true },
  { key: "analyticsTag", group: "Analytics", control: "text", default: undefined, cleared: null, api: "analytics_tag", advanced: true },
  { key: "analyticsDeviceType", group: "Analytics", control: "select", options: ["auto", "desktop", "mobile", "tablet"], default: "auto", advanced: true },
  { key: "mediaCustomUrl", group: "Analytics", control: "text", default: undefined, cleared: null, advanced: true },

  { key: "showUserInterface", group: "Advanced", control: "select", options: bool, default: true, advanced: true },
  { key: "clientSideEnabled", group: "Advanced", control: "select", options: bool, default: false, advanced: true, refetch: true },
  { key: "captureErrors", group: "Advanced", control: "select", options: bool, default: true, advanced: true },
];

const groupOrder = [...new Set(settingsManifest.map(({ group }) => group))];

const findSetting = (key) => settingsManifest.find((setting) => setting.key === key);

// One mapping between a setting's value and what a <select> shows, used by the
// panel and by the tests, so a value can never end up with no matching option.
const optionsFor = (setting, ctx = {}) => (
  typeof setting.options === "function" ? setting.options(ctx) : (setting.options || [])
);

const optionValue = (option) => `${option ?? ""}`;

const parseOption = (setting, option) => (
  setting.parse ? setting.parse(optionValue(option)) : option
);

const optionLabel = (setting, option, ctx) => (
  setting.format ? setting.format(parseOption(setting, option), ctx) : optionValue(option)
);

// null and undefined both mean "not set", and arrays are compared by value.
const sameValue = (a, b) => (
  (a ?? null) === (b ?? null) || JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
);

const selectedOption = (setting, value, ctx) => {
  const options = optionsFor(setting, ctx);
  const index = options.findIndex((option) => sameValue(parseOption(setting, option), value));

  return index === -1 ? undefined : optionValue(options[index]);
};

export default settingsManifest;
export { groupOrder, findSetting, optionsFor, optionValue, parseOption, optionLabel, selectedOption };
