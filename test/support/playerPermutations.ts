import { itemImage, advertImage } from "./base64Images.ts";

const playerPermutations = async (callback) => {
  for (const params of permutations(dimensions)) {
    if (skipPermutation(params)) { continue; }

    params.duration = params.advertIndex === 0 ? 15 : 30;
    params.widgetStyle = params.widgetPosition ? params.playerStyle : "none";

    await callback(params);
  }
};

const permutations = (object) => (
  Object.entries(object).reduce((arr, [key, values]) => (
    arr.flatMap(o => values.map(v => ({ ...o, [key]: v })))
  ), [{}])
);

const dimensions = {
  playerStyle: ["large", "screen", "small", "standard", "video"],
  playbackState: ["paused", "playing", "stopped"],
  adverts: [
    [{ clickThroughUrl: "https://deliveroo.com", imageUrl: advertImage, iconColor: "#00cdbc" }],
    [{ clickThroughUrl: "https://advert-without-image.com" }],
  ],
  advertIndex: [0, -1],
  playerTitle: [`A ${"very ".repeat(50)} long player title`],
  contentIndex: [0],
  currentTime: [10],
  content: [
    [{ title: "A reasonable length podcast title", imageUrl: itemImage, sourceUrl: "https://example.com" }],
    [{ title: `A ${"very ".repeat(50)} long title` }, ...Array(10).fill({ title: "Another playlist item" })],
  ],
  widgetPosition: [null, "auto", "center", "left", "right"],
  widgetStyle: ["none"],
  widgetWidth: [0, "50%", "auto"],
  playlistStyle: ["auto"],
};

const skipPermutation = (params) => {
  const testingTheWidget = params.widgetPosition;
  const testingNoImage = !params.adverts[0].imageUrl;

  const advertWouldntShow = params.advertIndex === 0 && params.playbackState === "stopped";
  if (advertWouldntShow) { return true; }

  const advertImageIsIrrelevant = testingNoImage && (params.advertIndex === -1 || ["small", "standard"].includes(params.playerStyle));
  if (advertImageIsIrrelevant) { return true; }

  const playlistWouldntShow = (testingTheWidget || params.playerStyle === "small") && params.content.length > 1;
  if (playlistWouldntShow) { return true; }

  const widthIsIrrelevant = !testingTheWidget && params.widgetWidth !== "auto";
  if (widthIsIrrelevant) { return true; }

  return false;
};

export default playerPermutations;
