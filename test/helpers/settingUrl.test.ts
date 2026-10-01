import { settingsUrl, parseIdentifier } from "../../src/helpers/settingUrl";
import { decodeUrlState } from "../../harness/urlState.js";

// The panel writes these URLs and the harness page reads them. They are separate
// files, because the page also runs against the published bundle, so the only
// thing keeping them honest is this test.
describe("setting URLs", () => {
  const roundTrip = (settings) => decodeUrlState(`?${settingsUrl({ settings })}`).settings;

  it("keeps each value's type", () => {
    const settings = {
      theme: "dark",
      radius: 0,
      video: true,
      titleEnabled: false,
      playerTitle: null,
      downloadFormats: ["mp3", "mp4"],
      videoSizes: ["16:9"],
      playbackRates: [1, 1.5],
    };

    expect(roundTrip(settings)).toEqual(settings);
  });

  it("keeps strings that look like other types", () => {
    const settings = { widgetWidth: "0", agentName: "5:00", widgetMargin: "32px 16px", accessCtaText: "true" };

    expect(roundTrip(settings)).toEqual(settings);
  });

  it("reads a hand-written URL", () => {
    const { identifiers, settings, advanced } = decodeUrlState(
      "?projectId=54044&contentId=97e4a9df&advanced=true&set=theme:dark&set=radius:0&set=agentQuestionsLimit:0&set=agentVoiceSecondsLimit:0"
    );

    expect(identifiers).toEqual({ projectId: 54044, contentId: "97e4a9df" });
    expect(settings).toEqual({ theme: "dark", radius: 0, agentQuestionsLimit: 0, agentVoiceSecondsLimit: 0 });
    expect(advanced).toEqual(true);
  });

  // The API takes project and playlist ids as numbers; a source id that
  // happens to be digits is still the publisher's string.
  it("types identifiers the same way from the URL and from the panel", () => {
    const cases = [
      ["projectId", "2476", 2476],
      ["playlistId", "86791", 86791],
      ["projectId", "abc", "abc"],
      ["sourceId", "12345", "12345"],
      ["contentId", "97e4a9df", "97e4a9df"],
      ["previewToken", "0042", "0042"],
    ];

    cases.forEach(([key, raw, expected]) => {
      expect(parseIdentifier(key, raw), `${key} in the panel`).toEqual(expected);
      expect(decodeUrlState(`?${key}=${raw}`).identifiers[key], `${key} in the URL`).toEqual(expected);
    });

    expect(settingsUrl({ identifiers: { projectId: 2476, playlistId: 86791 } })).toEqual("projectId=2476&playlistId=86791");
  });

  it("still understands the params the page used to take", () => {
    const { settings } = decodeUrlState("?playerStyle=standard&embedMode=agent&theme=dark&video=true&videoSize=9:16");

    expect(settings).toEqual({
      playerStyle: "standard",
      embedMode: "agent",
      theme: "dark",
      video: true,
      videoSizes: ["9:16"],
    });
  });

  it("leaves out identifiers that are not set", () => {
    const url = settingsUrl({ identifiers: { projectId: 54044, contentId: "", playlistId: undefined }, settings: {} });

    expect(url).toEqual("projectId=54044");
  });
});
