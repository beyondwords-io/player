import findSegmentIndex from "./findSegmentIndex";
import { updatePlayedAdvertMedia, alreadyPlayedAdvertMedia } from "./playedAdvertMedia";

const chooseAdvert = (player, { atTheEnd }) => {
  if (!player.content[player.contentIndex].adsEnabled) { return -1; }

  const currentAdvert = player.adverts[player.advertIndex];
  if (currentAdvert && !atTheEnd) { return player.advertIndex; }

  if (currentAdvert && atTheEnd) { updatePlayedAdvertMedia(currentAdvert); }
  const placements = placementsThatCanPlay(player, atTheEnd);

  let bestSoFar = -1;
  let bestType = -Infinity;
  let bestRandom = -Infinity;

  for (const [thisIndex, advert] of player.adverts.entries()) {
    if (alreadyPlayedAdvertMedia(advert)) { continue; }
    if (!placements.has(advert.placement)) { continue; }

    const thisType = typeScores[advert.type] || 0;
    if (thisType < bestType) { continue; }

    const thisRandom = Math.random();
    if (thisType === bestType && thisRandom < bestRandom) { continue; }

    bestSoFar = thisIndex;
    bestType = thisType;
    bestRandom = thisRandom;
  }

  return bestSoFar;
};

const typeScores = { vast: 1, custom: 0 };

const placementsThatCanPlay = (player, atTheEnd) => {
  const atTheStart = player.currentTime === 0;

  const isFirstItem = player.contentIndex === 0;
  const isLastItem = player.contentIndex === player.content.length - 1;

  const segments = player.content[player.contentIndex].segments;
  const segmentIndex = findSegmentIndex(segments, player.currentTime);
  const currentSegment = segments[segmentIndex];

  const isPlaylist = player.content.length > 1;
  const isBetweenPlaylistItems = isPlaylist && atTheStart && !isFirstItem;

  const eligiblePlacements = new Set();

  if (atTheStart)             { eligiblePlacements.add("pre-roll"); }

  if (0)  /*TODO: segments*/  { eligiblePlacements.add("mid-roll"); } // should exclude playlists
  if (isBetweenPlaylistItems) { eligiblePlacements.add("mid-roll"); }

  if (atTheEnd && isLastItem) { eligiblePlacements.add("post-roll"); }
  if (isBetweenPlaylistItems) { eligiblePlacements.add("post-roll"); }

  return eligiblePlacements;
}

export default chooseAdvert;
