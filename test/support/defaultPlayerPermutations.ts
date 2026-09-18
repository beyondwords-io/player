import { itemImage, advertImage } from "./base64Images.ts";

// A trimmed permutation set for the opt-in "default" player style. The legacy
// styles keep their full matrix in playerPermutations.ts; this list covers the
// default bar's key states without hundreds of extra baselines.

const audio = [{ id: 123, url: "http://example.com/audio.mp3", contentType: "audio/mpeg", duration: 30 }];

const singleItem = [{ title: "A reasonable length podcast title", imageUrl: itemImage, sourceUrl: "https://example.com", audio }];
const playlistItems = [
  { title: `A ${"very ".repeat(50)} long title`, audio },
  ...Array(3).fill({ title: "Another playlist item", audio }),
];

const advert = [{ clickThroughUrl: "https://deliveroo.com", imageUrl: advertImage, iconColor: "#00cdbc", audio }];

const base = {
  playerStyle: "default",
  widgetStyle: "none",
  widgetPosition: null,
  playbackState: "stopped",
  embedMode: "audio-agent",
  theme: "light",
  radius: 8,
  agentQuestionsLimit: null,
  agentVoiceSecondsLimit: null,
  adverts: [],
  advertIndex: -1,
  duration: 30,
  currentTime: 10,
  contentIndex: 0,
  content: singleItem,
  playerTitle: null,
  disclosureText: null,
  logoIconEnabled: true,
};

const list = [
  { ...base },
  { ...base, playbackState: "playing" },
  { ...base, playbackState: "paused" },
  { ...base, embedMode: "audio" },
  { ...base, embedMode: "audio", playbackState: "playing" },
  { ...base, theme: "dark" },
  { ...base, theme: "dark", playbackState: "playing" },
  { ...base, playbackState: "playing", adverts: advert, advertIndex: 0, duration: 15 },
  { ...base, content: playlistItems },
  { ...base, content: playlistItems, playbackState: "playing" },
  { ...base, disclosureText: "This article is read by an AI voice." },
  { ...base, playbackState: "playing", widgetStyle: "default", widgetPosition: "center" },
  { ...base, agentQuestionsLimit: 0, agentVoiceSecondsLimit: 0 },

  // A title during playback only when the publisher asked for one.
  { ...base, playbackState: "playing", playerTitle: "The Daily Example", titleEnabled: true },

  // The access tier states: the CTA takes the meta row and the bar is never dead.
  { ...base, segmentLimit: 0, accessCtaUrl: "https://example.com/subscribe", accessCtaText: "Subscribe to keep listening" },
  { ...base, segmentLimit: 2, segmentLimitReached: true, accessCtaUrl: "https://example.com/subscribe", accessCtaText: "Subscribe to keep listening" },
];

const defaultPlayerPermutations = async (callback) => {
  for (const params of list) {
    await callback(params);
  }
};

const defaultScreenshotName = (params) => (
  [
    "default",
    params.playbackState,
    params.embedMode,
    params.theme === "dark" && "dark",
    params.advertIndex === 0 && "advert",
    params.content.length > 1 && "playlist",
    params.widgetPosition && `widget-${params.widgetPosition}`,
    params.disclosureText && "disclosure",
    params.agentQuestionsLimit === 0 && params.agentVoiceSecondsLimit === 0 && "locked",
    params.playerTitle && "titled",
    params.segmentLimit === 0 && "title-only",
    params.segmentLimitReached && "preview-ended",
  ].filter(s => s).join("-")
);

export default defaultPlayerPermutations;
export { defaultScreenshotName };
