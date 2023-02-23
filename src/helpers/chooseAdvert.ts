import findSegmentIndex from "./findSegmentIndex";

const chooseAdvert = (player, { atTheEnd }) => {
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

  if (0)  /*TODO: segments*/  { eligiblePlacements.add("mid-roll"); }
  if (isBetweenPlaylistItems) { eligiblePlacements.add("mid-roll"); }

  if (atTheEnd && isLastItem) { eligiblePlacements.add("post-roll"); }
  if (isBetweenPlaylistItems) { eligiblePlacements.add("post-roll"); }

  console.log(eligiblePlacements);

  return -1;
};

export default chooseAdvert;
