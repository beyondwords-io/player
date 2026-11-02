import sendToAnalytics from "../../src/helpers/sendToAnalytics";

const mocks = vi.hoisted(() => ({ sendToCustomAnalytics: vi.fn() }));
vi.mock("../../src/api_clients/analyticsClient", () => ({
  default: class {
    sendToCustomAnalytics(data) { mocks.sendToCustomAnalytics(data); }
  },
}));

describe("sendToAnalytics", () => {
  const contentId = "4f8b2c1e-1d2a-4c3b-9e5f-6a7b8c9d0e1f";

  const mockPlayer = (props = {}) => ({
    projectId: 7,
    analyticsUrl: "https://analytics.example.com/events",
    analyticsConsent: "without-local-storage",
    analyticsDeviceType: "desktop",
    content: [{ id: contentId, audio: [], video: [] }],
    contentIndex: 0,
    adverts: [{ id: 42 }],
    advertIndex: 0,
    introsOutrosIndex: -1,
    duration: 30,
    currentTime: 1,
    playbackRate: 1,
    clickableSections: "none",
    ...props,
  });

  const send = (player, ...types) => types.forEach(type => sendToAnalytics(player, { type }));
  const sent = () => mocks.sendToCustomAnalytics.mock.calls.map(([event]) => event);

  beforeEach(() => mocks.sendToCustomAnalytics.mockReset());

  it("sends 'load' for the content while an advert is active", () => {
    send(mockPlayer(), "ContentAvailable");

    expect(sent()).toMatchObject([
      { event_type: "load", media_type: "content", ad_id: null, content_id: contentId },
    ]);
  });

  it("sends 'play' for the active advert", () => {
    send(mockPlayer(), "ContentAvailable", "PlaybackPlaying", "CurrentTimeUpdated");

    expect(sent()).toMatchObject([
      { event_type: "load", media_type: "content", ad_id: null },
      { event_type: "play", media_type: "ad", ad_id: 42, content_id: contentId },
    ]);
  });

  it("sends 'load' for the content and 'play' for the advert when a pre-roll starts playback", () => {
    send(mockPlayer(), "PlaybackPlaying", "CurrentTimeUpdated");

    expect(sent()).toMatchObject([
      { event_type: "load", media_type: "content", ad_id: null, content_id: contentId },
      { event_type: "play", media_type: "ad", ad_id: 42, content_id: contentId },
    ]);
  });

  it("sends 'load' and 'play' for the content when no advert is active", () => {
    send(mockPlayer({ advertIndex: -1 }), "ContentAvailable", "PlaybackPlaying", "CurrentTimeUpdated");

    expect(sent()).toMatchObject([
      { event_type: "load", media_type: "content", ad_id: null },
      { event_type: "play", media_type: "content", ad_id: null },
    ]);
  });
});
