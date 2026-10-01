import { contentVariantHasSection, variantSegmentIndex, withinSegmentLimit } from "../../src/helpers/contentVariants";

// Content comes back as one list of segments holding both variants, so an index
// into it is not a position within the variant being played. An access tier's
// segment_limit counts the article's segments, and mixing the two up stopped
// every summary dead on projects with a tier.
describe("contentVariants", () => {
  // The shape the API returns: title, body, then the summary, whose own
  // timeline starts again at zero.
  const segments = [
    { section: "title", startTime: 0 },
    { section: "body", startTime: 5 },
    { section: "body", startTime: 25 },
    { section: "body", startTime: 44 },
    { section: "summary", startTime: 0 },
    { section: "summary", startTime: 6.5 },
    { section: "summary", startTime: 19.5 },
  ];

  describe("contentVariantHasSection", () => {
    it("reads the article as its title and body, and the summary as itself", () => {
      expect(segments.filter(({ section }) => contentVariantHasSection(false, section)).length).toEqual(4);
      expect(segments.filter(({ section }) => contentVariantHasSection(true, section)).length).toEqual(3);
    });
  });

  describe("variantSegmentIndex", () => {
    it("counts position within the variant, not within the whole list", () => {
      expect(variantSegmentIndex(segments, 0, false)).toEqual(0);
      expect(variantSegmentIndex(segments, 3, false)).toEqual(3);

      // The summary's first segment is fourth in the list but first in the summary.
      expect(variantSegmentIndex(segments, 4, true)).toEqual(0);
      expect(variantSegmentIndex(segments, 5, true)).toEqual(1);
      expect(variantSegmentIndex(segments, 6, true)).toEqual(2);
    });

    it("copes with no segments and with an index before the start", () => {
      expect(variantSegmentIndex(undefined, 2, false)).toEqual(0);
      expect(variantSegmentIndex(segments, -1, false)).toEqual(0);
    });
  });

  describe("withinSegmentLimit", () => {
    it("lets the article play up to the limit and no further", () => {
      expect(withinSegmentLimit(segments, 0, false, 2)).toEqual(true);
      expect(withinSegmentLimit(segments, 1, false, 2)).toEqual(true);
      expect(withinSegmentLimit(segments, 2, false, 2)).toEqual(false);
      expect(withinSegmentLimit(segments, 3, false, 2)).toEqual(false);
    });

    it("does not truncate a summary, which is a preview in itself", () => {
      [4, 5, 6].forEach((index) => expect(withinSegmentLimit(segments, index, true, 2)).toEqual(true));

      // Not even a title-only tier, which would otherwise stop it at once.
      [4, 5, 6].forEach((index) => expect(withinSegmentLimit(segments, index, true, 0)).toEqual(true));
    });

    it("locks the article to its title when the limit is zero", () => {
      expect(withinSegmentLimit(segments, 0, false, 0)).toEqual(false);
    });

    it("allows everything when there is no limit", () => {
      expect(withinSegmentLimit(segments, 3, false, undefined)).toEqual(true);
      expect(withinSegmentLimit(segments, 6, true, null)).toEqual(true);
    });

    it("allows the intro, the adverts and the start, which have no segment", () => {
      expect(withinSegmentLimit(segments, -1, false, 2)).toEqual(true);
    });
  });
});
