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
  agentAccess: "full",
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
  { ...base, agentAccess: "disabled" },
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
    params.agentAccess === "disabled" && "locked",
  ].filter(s => s).join("-")
);

export default defaultPlayerPermutations;
export { defaultScreenshotName };
