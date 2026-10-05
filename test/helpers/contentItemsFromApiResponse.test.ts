import contentItemsFromApiResponse, { hasSummaryMedia } from "../../src/helpers/contentItemsFromApiResponse";

describe("contentItemsFromApiResponse", () => {
  const withSummary = { id: "a", summarization: { audio: [{ id: 1 }], video: [] } };
  const withoutSummary = { id: "b", summarization: { audio: [], video: [] } };
  const withoutSummarization = { id: "c" };

  describe("hasSummaryMedia", () => {
    it("is true when summary audio is present", () => {
      expect(hasSummaryMedia(withSummary)).toBe(true);
    });

    it("is true when summary video is present", () => {
      expect(hasSummaryMedia({ summarization: { audio: [], video: [{ id: 1 }] } })).toBe(true);
    });

    it("is false when summarization media is empty", () => {
      expect(hasSummaryMedia(withoutSummary)).toBe(false);
      expect(hasSummaryMedia(withoutSummarization)).toBe(false);
    });
  });

  describe("contentItemsFromApiResponse", () => {
    it("returns all items when summary mode is off", () => {
      const items = [withSummary, withoutSummary, withoutSummarization];
      expect(contentItemsFromApiResponse(items, false)).toEqual(items);
    });

    it("filters out items without summary media when summary mode is on", () => {
      expect(contentItemsFromApiResponse([withSummary, withoutSummary, withoutSummarization], true)).toEqual([withSummary]);
    });
  });
});
