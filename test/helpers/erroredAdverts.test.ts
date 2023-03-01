import { updateErroredAdverts, resultedInAPlaybackError } from "../../src/helpers/erroredAdverts";

describe("erroredAdverts", () => {
  const vastUrl1 = "https://example.com/1.xml";
  const vastUrl2 = "https://example.com/2.xml";
  const vastUrl3 = "https://example.com/3.xml";
  const vastUrl4 = "https://example.com/4.xml";

  const source1 = "https://example.com/1.mp3";
  const source2 = "https://example.com/2.mp3";
  const source3 = "https://example.com/3.mp3";
  const source4 = "https://example.com/4.mp3";

  it("keeps track of VAST URLs that have resulted in a playback error", () => {
    updateErroredAdverts({ vastUrl: vastUrl1, media: [] });
    updateErroredAdverts({ vastUrl: vastUrl2, media: [] });
    updateErroredAdverts({ vastUrl: vastUrl3, media: [] });

    expect(resultedInAPlaybackError({ vastUrl: vastUrl1 , media: [] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: vastUrl2 , media: [] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: vastUrl3 , media: [] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: vastUrl4 , media: [] })).toEqual(false);
  });

  it("keeps track of media sources that have resulted in a playback error", () => {
    updateErroredAdverts({ vastUrl: null, media: [{ url: source1 }] });
    updateErroredAdverts({ vastUrl: null, media: [{ url: source2 }, { url: source3 }] });

    expect(resultedInAPlaybackError({ vastUrl: null , media: [{ url: source1 }] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: null , media: [{ url: source2 }] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: null , media: [{ url: source3 }, { url: source4 }] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: null , media: [{ url: source4 }] })).toEqual(false);
  });
});
