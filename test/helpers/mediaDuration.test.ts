import mediaDuration from "../../src/helpers/mediaDuration";

describe("mediaDuration", () => {
  const audio = [{ duration: 30 }];
  const video = [{ duration: 40 }];

  it("prefers the top-level duration over the media's", () => {
    expect(mediaDuration({ duration: 120, audio, video })).toEqual(120);
  });

  it("uses the top-level duration when there is no media", () => {
    expect(mediaDuration({ duration: 120, audio: [], video: [] })).toEqual(120);
    expect(mediaDuration({ duration: 120 })).toEqual(120);
  });

  it("falls back to the first audio's duration", () => {
    expect(mediaDuration({ audio, video })).toEqual(30);
    expect(mediaDuration({ duration: null, audio, video })).toEqual(30);
  });

  it("falls back to the first video's duration when there is no audio", () => {
    expect(mediaDuration({ audio: [], video })).toEqual(40);
    expect(mediaDuration({ video })).toEqual(40);
  });

  it("returns 0 when the duration is unknown", () => {
    expect(mediaDuration(undefined)).toEqual(0);
    expect(mediaDuration(null)).toEqual(0);
    expect(mediaDuration({})).toEqual(0);
    expect(mediaDuration({ audio: [], video: [] })).toEqual(0);
    expect(mediaDuration({ audio: [{ url: "a.mp3" }], video: [] })).toEqual(0);
  });
});
