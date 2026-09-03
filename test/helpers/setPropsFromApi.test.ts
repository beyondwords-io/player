import setPropsFromApi, { identifiersArray, fetchData } from "../../src/helpers/setPropsFromApi";
import { PLAYER_COLOR_PRESETS, VIDEO_COLOR_PRESET } from "../../src/helpers/default_theme/palettes";

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
        dark_theme: { text_color: "#eeeeee", background_color: "#111111", icon_color: "#dddddd" },
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
      expect(player.projectTheme).toEqual("light");
      expect(player.apiLightTheme).toEqual({
        ...PLAYER_COLOR_PRESETS.light,
        textColor: "#111111",
        backgroundColor: "#ffffff",
        iconColor: "#222222",
        highlightColor: "#ffff00",
        wordHighlightColor: "#00ffff",
      });
      expect(player.apiDarkTheme).toEqual({
        ...PLAYER_COLOR_PRESETS.dark,
        textColor: "#eeeeee",
        backgroundColor: "#111111",
        iconColor: "#dddddd",
      });
      expect(player.apiVideoTheme).toEqual(VIDEO_COLOR_PRESET);
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

    it("clears an API-provided agent when a later response has no content", async () => {
      const player = mockPlayer();
      mocks.fetchJson.mockResolvedValueOnce({
        ...payload,
        conversational_agent: { elevenlabs_agent_id: "agent_previous" },
      });

      await setPropsFromApi(player);
      expect(player.agentId).toEqual("agent_previous");

      mocks.fetchJson.mockResolvedValueOnce({ content: null });
      await setPropsFromApi(player);

      expect(player.agentId).toBeUndefined();
      expect(player.apiProps.agentId).toBeUndefined();
    });

    it("maps the new settings, access tier and agent metadata", async () => {
      mocks.fetchJson.mockResolvedValueOnce({
        ...payload,
        settings: {
          ...payload.settings,
          radius: 12,
          accent_color: "#123456",
          accent_text_color: "#ffffff",
          disclosure_text: "AI generated",
          disclosure_link: "https://example.com/disclosure",
          agent_color: "#111111,#222222",
          agent_avatar_url: "https://example.com/avatar.png",
          agent_placeholder: "Ask us anything",
          agent_shortcuts: ["What happened?", "Why now?"],
          info_text: "Answers may be inaccurate",
          agent_voice_enabled: false,
          variants: ["article", "summary"],
          embed_mode: "audio-agent",
          widget_embed_mode: "agent",
        },
        access_tier: {
          slug: "subscribed",
          segment_limit: 5,
          cta_text: "Subscribe",
          cta_url: "https://example.com/subscribe",
          player_agent: {
            cta_text: "Upgrade to ask more",
            cta_url: "https://example.com/agent",
            questions_limit: 3,
            seconds_limit: 90,
          },
        },
        conversational_agent: {
          elevenlabs_agent_id: "agent_123",
          name: "Zoe",
          first_message: "Hello",
          model: "gemini-2.0-flash",
          system_prompt: "Answer from the article",
          language: { code: "en" },
          voice: { voice_id: "voice_123", model_id: "eleven_turbo_v2" },
        },
      });

      const player = mockPlayer();
      await setPropsFromApi(player);

      expect(player).toMatchObject({
        radius: 12,
        accentColor: "#123456",
        accentTextColor: "#ffffff",
        disclosureText: "AI generated",
        disclosureLink: "https://example.com/disclosure",
        agentColor: "#111111,#222222",
        agentAvatar: "https://example.com/avatar.png",
        agentPlaceholder: "Ask us anything",
        shortcuts: ["What happened?", "Why now?"],
        infoText: "Answers may be inaccurate",
        agentVoice: false,
        variants: ["article", "summary"],
        embedMode: "audio-agent",
        widgetEmbedMode: "agent",
        segmentLimit: 5,
        accessCtaText: "Subscribe",
        accessCtaUrl: "https://example.com/subscribe",
        agentCtaText: "Upgrade to ask more",
        agentCtaUrl: "https://example.com/agent",
        agentQuestionsLimit: 3,
        agentVoiceSecondsLimit: 90,
        agentId: "agent_123",
        agentName: "Zoe",
        agentSessionConfig: {
          firstMessage: "Hello",
          model: "gemini-2.0-flash",
          systemPrompt: "Answer from the article",
          language: "en",
          voiceId: "voice_123",
          voiceModelId: "eleven_turbo_v2",
        },
      });
    });

    it("uses access_tier as the sole source of tier response data", async () => {
      mocks.fetchJson.mockResolvedValueOnce({
        ...payload,
        settings: {
          ...payload.settings,
          access_tier: "deprecated-tier",
          segment_limit: 9,
        },
        access_tier: {
          slug: "anonymous",
          segment_limit: 2,
          cta_text: "Subscribe",
          cta_url: "https://example.com/subscribe",
          player_agent: {
            cta_text: "Upgrade",
            cta_url: "https://example.com/agent",
            questions_limit: 3,
            seconds_limit: 60,
          },
        },
      });

      const player = mockPlayer({ accessTier: "requested-tier" });
      await setPropsFromApi(player);

      expect(player).toMatchObject({
        accessTier: "requested-tier",
        segmentLimit: 2,
        accessCtaText: "Subscribe",
        accessCtaUrl: "https://example.com/subscribe",
        agentCtaText: "Upgrade",
        agentCtaUrl: "https://example.com/agent",
        agentQuestionsLimit: 3,
        agentVoiceSecondsLimit: 60,
      });
      expect(player).not.toHaveProperty("resolvedAccessTier");
    });

    it("keeps nested literal values exact and gives them precedence over legacy top-level colours", async () => {
      mocks.fetchJson.mockResolvedValueOnce({
        ...payload,
        settings: {
          ...payload.settings,
          agent_color: "legacy-agent",
          accent_color: "legacy-accent",
          accent_text_color: "legacy-accent-text",
          light_theme: {
            ...payload.settings.light_theme,
            text_color: "#111",
            secondary_text_color: "invalid secondary",
            subtle_color: "",
            link_color: "low-contrast-link",
            agent_color: "linear-gradient(1deg, red, red)",
            accent_color: "nested-accent",
            accent_text_color: "nested-accent-text",
          },
          video_theme: {
            ...payload.settings.video_theme,
            background_color: "video-background",
            subtle_color: "video-subtle",
          },
        },
      });

      const player = mockPlayer();
      await setPropsFromApi(player);

      expect(player.apiLightTheme).toMatchObject({
        textColor: "#111",
        secondaryTextColor: "invalid secondary",
        subtleColor: "",
        linkColor: "low-contrast-link",
        agentColor: "linear-gradient(1deg, red, red)",
        accentColor: "nested-accent",
        accentTextColor: "nested-accent-text",
      });
      expect(player.apiDarkTheme).toMatchObject({
        agentColor: "legacy-agent",
        accentColor: "legacy-accent",
        accentTextColor: "legacy-accent-text",
      });
      expect(player.apiVideoTheme).toMatchObject({ backgroundColor: "video-background", subtleColor: "video-subtle" });
    });

    it("maps complete Light and Dark palettes for adverts", async () => {
      mocks.fetchJson.mockResolvedValueOnce({
        ...payload,
        ads: [{
          id: "ad-1",
          type: "audio",
          placement: "pre-roll",
          theme: "auto",
          click_through_url: "https://example.com",
          light_theme: { text_color: "ad-light" },
          dark_theme: { text_color: "ad-dark" },
          video_theme: { background_color: "ad-video" },
          audio: [],
          video: [],
        }],
      });

      const player = mockPlayer();
      await setPropsFromApi(player);

      expect(player.adverts[0]).toMatchObject({
        theme: "auto",
        lightTheme: { ...PLAYER_COLOR_PRESETS.light, textColor: "ad-light" },
        darkTheme: { ...PLAYER_COLOR_PRESETS.dark, textColor: "ad-dark" },
        videoTheme: { ...VIDEO_COLOR_PRESET, backgroundColor: "ad-video" },
      });
    });
  });
});
