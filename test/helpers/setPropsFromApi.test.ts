import setPropsFromApi, { identifiersArray, fetchData } from "../../src/helpers/setPropsFromApi";

const mocks = vi.hoisted(() => ({ fetchJson: vi.fn() }));
vi.mock("../../src/helpers/fetchJson", () => ({ default: mocks.fetchJson }));

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

  describe("applying a response", () => {
    const payload = {
      language: "fr",
      content: [{
        id: "c1",
        title: "A title",
        audio: [{ id: 1, url: "https://example.com/a.mp3", content_type: "audio/mpeg", duration: 30000 }],
        video: [],
        segments: [],
      }],
      settings: {
        theme: "light",
        player_style: "large",
        light_theme: { text_color: "#111111", background_color: "#ffffff", icon_color: "#222222", highlight_color: "#ffff00", word_highlight_color: "#00ffff" },
        video_theme: { text_color: "#ffffff", background_color: "#000000", icon_color: "#ffffff" },
      },
      video_settings: { logo_image_position: "top-left" },
    };

    const mockPlayer = (initialProps = {}) => ({
      playerApiUrl: "https://api.example.com/projects/{id}/player",
      projectId: 7,
      contentId: "c1",
      content: [],
      contentIndex: 0,
      onEvent: () => {},
      initialProps,
      ...initialProps,
    });

    beforeEach(() => mocks.fetchJson.mockResolvedValue(payload));

    it("keeps the response, the request URL and every value the API set", async () => {
      const player = mockPlayer();
      await setPropsFromApi(player);

      expect(player.apiPayload).toEqual(payload);
      expect(player.apiRequestUrl).toEqual("https://api.example.com/projects/7/player/by_content_id/c1");
      expect(player.apiProps.backgroundColor).toEqual("#ffffff");
      expect(player.apiProps.contentLanguage).toEqual("fr");
      expect(player.backgroundColor).toEqual("#ffffff");
    });

    it("records what the API asked for even when an override wins", async () => {
      const player = mockPlayer({ backgroundColor: "yellow", playerStyle: "default" });
      await setPropsFromApi(player);

      expect(player.backgroundColor).toEqual("yellow");
      expect(player.playerStyle).toEqual("default");

      expect(player.apiProps.backgroundColor).toEqual("#ffffff");
      expect(player.apiProps.playerStyle).toEqual("large");
    });

    it("keeps the response inspectable when no content comes back", async () => {
      mocks.fetchJson.mockResolvedValue({ content: null });

      const player = mockPlayer();
      await setPropsFromApi(player);

      expect(player.apiPayload).toEqual({ content: null });
      expect(player.apiRequestUrl).toContain("by_content_id/c1");
      expect(player.content).toEqual([]);
    });
  });
});
