const contentVariantHasSection = (summary, section) => {
  if (summary) {
    return section === "summary";
  } else {
    return section === "title" || section === "body";
  }
};

// Content has one list of segments holding every variant, so a segment index is
// a position in that list, not in the variant being played. For the full
// article the two coincide, because its title and body come first; for the
// summary they do not - its segments start after the body, e.g. at 24 of 27.
const variantSegmentIndex = (segments, index, summary) => (
  (segments || []).slice(0, Math.max(0, index)).filter(({ section }) => contentVariantHasSection(summary, section)).length
);

// An access tier's segment_limit counts the segments of the article, so it is
// applied to the full variant. A summary is a preview in its own right - two of
// its three segments would be most of it - so a limit does not truncate it.
//
// Whether a tier grants the summary at all is a product decision that the tier
// itself will carry: see the follow-up issue on S-8870.
const withinSegmentLimit = (segments, index, summary, segmentLimit) => {
  if (typeof segmentLimit !== "number") { return true; }
  if (summary) { return true; }
  if (index < 0) { return true; }

  return variantSegmentIndex(segments, index, summary) < segmentLimit;
};

export { contentVariantHasSection, variantSegmentIndex, withinSegmentLimit };
