const findSegmentIndex = (segments, time, contentVariant) => {
  const segmentsForVariant = segments.filter(s => {
    if (contentVariant === "article" && (s.section === "title" || s.section === "body")) return true;
    if (contentVariant === "summary" && s.section === "summary") return true;
    return false;
  });
  const nextIndex = segmentsForVariant.findIndex(s => s.startTime > time);
  const afterTheEnd = nextIndex === -1;

  const thisIndex = nextIndex - 1;
  const beforeTheStart = thisIndex === -1;

  let index;
  if (beforeTheStart) {
    index = 0;
  } else if (afterTheEnd) {
    index = segmentsForVariant.length - 1;
  } else {
    index = thisIndex;
  }

  return segments.indexOf(segmentsForVariant[index]);
};

export default findSegmentIndex;
