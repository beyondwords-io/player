import { identifiersArray, fetchData } from "../../src/helpers/setPropsFromApi";

describe("setPropsFromApi", () => {
  describe("identifiersArray", () => {
    it("returns an array of snake case identifiers from the player props", () => {
      const mockPlayer = {
        contentId: 1,
        playlistId: 2,
        sourceId: 3,
        sourceUrl: "https://example.com/a",
        playlist: [
          { contentId: 4 },
          { playlistId: 5 },
          { sourceId: 6 },
          { sourceUrl: "https://example.com/b" },
        ]
      };

      expect(identifiersArray(mockPlayer)).toEqual([
        { content_id: 1 },
        { playlist_id: 2 },
        { source_id: 3 },
        { source_url: "https://example.com/a" },
        { content_id: 4 },
        { playlist_id: 5 },
        { source_id: 6 },
        { source_url: "https://example.com/b" },
      ]);
    });

    it("de-duplicates identifiers", () => {
      const mockPlayer = {
        contentId: 1,
        playlistId: 1,
        sourceId: 1,
        sourceUrl: "https://example.com/a",
        playlist: [
          { contentId: 1 },
          { playlistId: 1 },
          { sourceId: 1 },
          { sourceUrl: "https://example.com/a" },
          { contentId: 1 },
          { playlistId: 1 },
          { sourceId: 1 },
          { sourceUrl: "https://example.com/a" },
        ]
      };

      expect(identifiersArray(mockPlayer)).toEqual([
        { content_id: 1 },
        { playlist_id: 1 },
        { source_id: 1 },
        { source_url: "https://example.com/a" },
      ]);
    });
  });

  describe("fetchData", () => {
    let calls;
    beforeEach(() => calls = []);

    const mockClient = {
      byIdentifiers: arg => { calls.push("byIdentifiers", arg); return "result"; },
      byContentId:   arg => { calls.push("byContentId",   arg); return "result"; },
      byPlaylistId:  arg => { calls.push("byPlaylistId",  arg); return "result"; },
      bySourceId:    arg => { calls.push("bySourceId",    arg); return "result"; },
      bySourceUrl:   arg => { calls.push("bySourceUrl",   arg); return "result"; },
    };

    it("can fetch by request body and returns the result", () => {
      const result = fetchData(mockClient, [{ content_id: 123 }, { playlist_id: 456 }]);

      expect(calls).toEqual(["byIdentifiers", [{ content_id: 123 }, { playlist_id: 456 }]]);
      expect(result).toEqual("result");
    });

    it("can fetch by content_id and returns the result", () => {
      const result = fetchData(mockClient, [{ content_id: 123 }]);

      expect(calls).toEqual(["byContentId", 123]);
      expect(result).toEqual("result");
    });

    it("can fetch by playlist_id and returns the result", () => {
      const result = fetchData(mockClient, [{ playlist_id: 123 }]);

      expect(calls).toEqual(["byPlaylistId", 123]);
      expect(result).toEqual("result");
    });

    it("can fetch by source_id and returns the result", () => {
      const result = fetchData(mockClient, [{ source_id: 123 }]);

      expect(calls).toEqual(["bySourceId", 123]);
      expect(result).toEqual("result");
    });

    it("can fetch by source_url and returns the result", () => {
      const result = fetchData(mockClient, [{ source_url: "https://example.com" }]);

      expect(calls).toEqual(["bySourceUrl", "https://example.com"]);
      expect(result).toEqual("result");
    });
  });
});
