import findSegmentIndex from "./findSegmentIndex";
import { updatePlayedAdvertMedia, alreadyPlayedAdvertMedia } from "./playedAdvertMedia";

const chooseAdvert = ({ adverts, advertIndex, content = [], contentIndex, currentTime, atTheStart, atTheEnd } = {}) => {
  if (!content[contentIndex]?.adsEnabled) { return -1; }

  const currentAdvert = adverts[advertIndex];

  if (currentAdvert && !atTheEnd) { return advertIndex; }
  if (currentAdvert && atTheEnd) { updatePlayedAdvertMedia(currentAdvert); return -1; }

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
  const isAfterMidroll = midrollSegment && currentTime > midrollSegment.startTime;

  const lastSegment = segments[segments.length - 1];
  const duration = lastSegment ? lastSegment.startTime + lastSegment.duration : 0;
  const closeToEnd = currentTime > duration - minimumTimeUntilEndForMidrollToPlay;

  const eligiblePlacements = new Set();

  if (atTheStart)                    { eligiblePlacements.add("pre-roll"); }

  if (isAfterMidroll && !closeToEnd) { eligiblePlacements.add("mid-roll"); }
  if (isBetweenPlaylistItems)        { eligiblePlacements.add("mid-roll"); }

  if (atTheEnd && isLastItem)        { eligiblePlacements.add("post-roll"); }
  if (isBetweenPlaylistItems)        { eligiblePlacements.add("post-roll"); }

  return eligiblePlacements;
};

// Don't play mid-roll adverts if the content duration is less than two minutes.
const minimumDurationForMidrollToPlay = 2 * 60;

// Don't play mid-roll adverts if seeked to the last 10 seconds of content.
const minimumTimeUntilEndForMidrollToPlay = 10;

// Play mid-roll adverts from segments starting after half-way time minus 0.5 seconds.
const halfWayTimeToleranceForMidroll = 0.5;

const midrollSegmentIndex = (segments) => {
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment) { return; }

  const duration = lastSegment.startTime + lastSegment.duration;
  if (duration < minimumDurationForMidrollToPlay) { return; }

  const halfWayTime = duration / 2;
  const halfWayIndex = findSegmentIndex(segments, duration / 2);

  const startTime = segments[halfWayIndex].startTime;
  const isHalfWay = startTime >= halfWayTime - halfWayTimeToleranceForMidroll;

  const midrollIndex = isHalfWay ? halfWayIndex : halfWayIndex + 1;
  if (midrollIndex === segments.length) { return; }

  return midrollIndex;
};

export default chooseAdvert;
