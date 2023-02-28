const findSegmentIndex = (segments, time) => {
  const nextIndex = segments.findIndex(s => s.startTime > time);
  const afterTheEnd = nextIndex === -1;

  const thisIndex = nextIndex - 1;
  const beforeTheStart = thisIndex === -1;

  if (beforeTheStart) {
    return 0;
  } else if (afterTheEnd) {
    return segments.length - 1;
  } else {
    return thisIndex;
  }
};

export default findSegmentIndex;
