import { contentVariantHasSection } from "./contentVariants";

const findSegmentIndex = (segments, time, summary) => {
  const segmentsForVariant = segments.filter(s => contentVariantHasSection(summary, s.section));
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
