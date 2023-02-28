import findSegmentIndex from "./findSegmentIndex";
import { updatePlayedAdvertMedia, alreadyPlayedAdvertMedia } from "./playedAdvertMedia";

const chooseAdvert = ({ adverts, advertIndex, content = [], contentIndex, currentTime, atTheStart, atTheEnd } = {}) => {
  if (!content[contentIndex]?.adsEnabled) { return -1; }

  const currentAdvert = adverts[advertIndex];
  if (currentAdvert && !atTheEnd) { return advertIndex; }

  if (currentAdvert && atTheEnd) { updatePlayedAdvertMedia(currentAdvert); }
  const placements = placementsThatCanPlay({ content, contentIndex, currentTime, atTheStart, atTheEnd });

  let bestSoFar = -1;
  let bestType = -Infinity;
  let bestRandom = -Infinity;

  for (const [thisIndex, advert] of adverts.entries()) {
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

const placementsThatCanPlay = ({ content, contentIndex, currentTime, atTheStart, atTheEnd }) => {
  const isFirstItem = contentIndex === 0;
  const isLastItem = contentIndex === content.length - 1;

  const segments = content[contentIndex].segments;
  const segmentIndex = findSegmentIndex(segments, currentTime);
  const currentSegment = segments[segmentIndex];

  const isPlaylist = content.length > 1;
  const isBetweenPlaylistItems = isPlaylist && atTheStart && !isFirstItem;

  const midrollIndex = isPlaylist ? null : midrollSegmentIndex(segments);
  const midrollSegment = segments[midrollIndex];
  const isAfterMidrollTime = midrollSegment && currentTime > midrollSegment.startTime;

  const eligiblePlacements = new Set();

  if (atTheStart)             { eligiblePlacements.add("pre-roll"); }

  if (isAfterMidrollTime)     { eligiblePlacements.add("mid-roll"); }
  if (isBetweenPlaylistItems) { eligiblePlacements.add("mid-roll"); }

  if (atTheEnd && isLastItem) { eligiblePlacements.add("post-roll"); }
  if (isBetweenPlaylistItems) { eligiblePlacements.add("post-roll"); }

  return eligiblePlacements;
};

// Don't play mid-roll adverts if the content duration is less than two minutes.
const minimumDurationForMidrollToPlay = 2 * 60;

const midrollSegmentIndex = (segments) => {
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment) { return; }

  const duration = lastSegment.startTime + lastSegment.duration;
  if (duration < minimumDurationForMidrollToPlay) { return; }

  const midrollIndex = findSegmentIndex(segments, duration / 2) + 1;
  if (midrollIndex === segments.length) { return; }

  return midrollIndex;
};

export default chooseAdvert;
