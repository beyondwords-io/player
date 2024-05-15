import findSegmentIndex from "./findSegmentIndex";
import isIosSafari from "./isIosSafari";
import isIosChrome from "./isIosChrome";
import { updateErroredAdverts, resultedInAPlaybackError } from "./erroredAdverts";
import { updatePlayedAdvertMedia, alreadyPlayedAdvertMedia } from "./playedAdvertMedia";

const chooseAdvert = ({ introsOutrosIndex, adverts, advertIndex, preloadAdvertIndex, content = [], contentIndex, currentTime, atTheStart, atTheEnd, errored, minTimeUntilEndForMidroll, minDurationForMidroll, contentVariant } = {}) => {
  const currentAdvert = adverts && adverts[advertIndex];

  x: if (currentAdvert) {
    if (errored) { updateErroredAdverts(currentAdvert); break x; } // Choose another advert.
    if (atTheEnd) { updatePlayedAdvertMedia(currentAdvert); return -1; } // Play the content.
    if (!atTheEnd) { return advertIndex; } // Keep playing the current advert until it ends.
  }

  if (!content[contentIndex]?.adsEnabled) { return -1; }
  if (introsOutrosIndex !== -1) { return -1; } // Wait until the intro/outro has finished.

  const placements = placementsThatCanPlay({ content, contentIndex, currentTime, atTheStart, atTheEnd, minTimeUntilEndForMidroll, minDurationForMidroll, contentVariant });

  let bestSoFar = -1;
  let bestType = -Infinity;
  let bestRandom = -Infinity;

  for (const [thisIndex, advert] of adverts.entries()) {
    if (alreadyPlayedAdvertMedia(advert)) { continue; }
    if (resultedInAPlaybackError(advert)) { continue; }
    if (!placements.has(advert.placement)) { continue; }

    const thisType = typeScores[advert.type] || 0;
    if (thisType < bestType) { continue; }

    const thisRandom = preloadAdvertIndex === thisIndex ? Infinity : Math.random();
    if (thisType === bestType && thisRandom < bestRandom) { continue; }

    bestSoFar = thisIndex;
    bestType = thisType;
    bestRandom = thisRandom;
  }

  return bestSoFar;
};

const typeScores = { vast: 1, custom: 0 };

const placementsThatCanPlay = ({ content, contentIndex, currentTime, atTheStart, atTheEnd, minTimeUntilEndForMidroll, minDurationForMidroll, contentVariant }) => {
  const isFirstItem = contentIndex === 0;
  const isLastItem = contentIndex === content.length - 1;

  const isPlaylist = content.length > 1;
  const isBetweenPlaylistItems = isPlaylist && atTheStart && !isFirstItem;

  const segments = content[contentIndex].segments;
  const lastSegment = segments[segments.length - 1];

  const midrollIndex = isPlaylist ? null : midrollSegmentIndex(segments, minDurationForMidroll, contentVariant);
  const midrollSegment = segments[midrollIndex];
  const isAfterMidroll = midrollSegment && currentTime > midrollSegment.startTime && !isIosSafari() && !isIosChrome();

  // Don't play mid-roll adverts if seeked to the last N seconds of content.
  const duration = lastSegment ? lastSegment.startTime + lastSegment.duration : 0;
  const closeToEnd = currentTime > duration - minTimeUntilEndForMidroll;

  const eligiblePlacements = new Set();

  if (atTheStart)                    { eligiblePlacements.add("pre-roll"); }

  if (isAfterMidroll && !closeToEnd) { eligiblePlacements.add("mid-roll"); }
  if (isBetweenPlaylistItems)        { eligiblePlacements.add("mid-roll"); }

  if (atTheEnd && isLastItem)        { eligiblePlacements.add("post-roll"); }
  if (isBetweenPlaylistItems)        { eligiblePlacements.add("post-roll"); }

  return eligiblePlacements;
};

// Play mid-roll adverts from segments starting after half-way time minus 0.5 seconds.
const halfWayTimeToleranceForMidroll = 0.5;

const midrollSegmentIndex = (segments, minDurationForMidroll, contentVariant) => {
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment) { return; }

  // Don't play mid-roll adverts if the content duration is too short.
  const duration = lastSegment.startTime + lastSegment.duration;
  if (duration < minDurationForMidroll) { return; }

  const halfWayTime = duration / 2;
  const halfWayIndex = findSegmentIndex(segments, duration / 2, contentVariant);

  const startTime = segments[halfWayIndex].startTime;
  const isHalfWay = startTime >= halfWayTime - halfWayTimeToleranceForMidroll;

  const midrollIndex = isHalfWay ? halfWayIndex : halfWayIndex + 1;
  if (midrollIndex === segments.length) { return; }

  return midrollIndex;
};

export default chooseAdvert;
