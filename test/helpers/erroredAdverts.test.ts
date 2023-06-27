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
    updateErroredAdverts({ vastUrl: vastUrl1, audio: [], video: [] });
    updateErroredAdverts({ vastUrl: vastUrl2, audio: [], video: [] });
    updateErroredAdverts({ vastUrl: vastUrl3, audio: [], video: [] });

    expect(resultedInAPlaybackError({ vastUrl: vastUrl1 , audio: [], video: [] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: vastUrl2 , audio: [], video: [] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: vastUrl3 , audio: [], video: [] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: vastUrl4 , audio: [], video: [] })).toEqual(false);
  });

  it("keeps track of media sources that have resulted in a playback error", () => {
    updateErroredAdverts({ vastUrl: null, audio: [{ url: source1 }], video: [] });
    updateErroredAdverts({ vastUrl: null, audio: [{ url: source2 }], video: [{ url: source3 }] });

    expect(resultedInAPlaybackError({ vastUrl: null , audio: [{ url: source1 }], video: [] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: null , audio: [], video: [{ url: source2 }] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: null , audio: [{ url: source3 }, { url: source4 }], video: [] })).toEqual(true);
    expect(resultedInAPlaybackError({ vastUrl: null , audio: [], video: [{ url: source4 }] })).toEqual(false);
  });
});
