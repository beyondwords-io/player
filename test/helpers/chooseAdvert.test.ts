import chooseAdvert from "../../src/helpers/chooseAdvert";
import playedAdvertMedia from "../../src/helpers/playedAdvertMedia";

// A post-roll advert plays after the last item of a playlist. An access tier
// stops after each article instead of moving on, so the item it stops after
// counts as the last one (endsPlayback).
describe("chooseAdvert", () => {
  const item = () => ({ adsEnabled: true, segments: [{ startTime: 0, duration: 1 }, { startTime: 1, duration: 1 }] });
  const advert = (placement) => ({ type: "custom", placement, audio: [{ url: `https://example.com/${placement}.mp3` }], video: [] });
  const adverts = [advert("pre-roll"), advert("mid-roll"), advert("post-roll")];

  const choose = (args) => chooseAdvert({
    introsOutrosIndex: -1, adverts, advertIndex: -1, preloadAdvertIndex: -1, content: [item(), item(), item()],
    currentTime: 2, minDurationForMidroll: 120, minTimeUntilEndForMidroll: 10, ...args,
  });

  beforeEach(() => playedAdvertMedia.clear());

  it("chooses the post-roll at the end of the last item, or of any item that ends playback", () => {
    expect(choose({ contentIndex: 0, atTheEnd: true })).toEqual(-1);
    expect(choose({ contentIndex: 0, atTheEnd: true, endsPlayback: true })).toEqual(2);
    expect(choose({ contentIndex: 2, atTheEnd: true })).toEqual(2);
  });

  it("only chooses the post-roll at the end when playback ends there", () => {
    expect(choose({ contentIndex: 0, endsPlayback: true })).toEqual(-1);
    expect(choose({ contentIndex: 0, atTheStart: true, currentTime: 0, endsPlayback: true })).toEqual(0);
  });

  // The content ends again after the post-roll. Custom adverts are skipped as
  // played media by then, but VAST adverts aren't, so playedAtTheEnd skips them.
  it("doesn't choose an advert that already played at the end, but another one can play", () => {
    const vast = { type: "vast", placement: "post-roll", vastUrl: "https://example.com/vast.xml", audio: [], video: [] };

    expect(choose({ adverts: [vast], contentIndex: 2, atTheEnd: true })).toEqual(0);
    expect(choose({ adverts: [vast], contentIndex: 2, atTheEnd: true, playedAtTheEnd: [0] })).toEqual(-1);
    expect(choose({ adverts: [vast, advert("post-roll")], contentIndex: 2, atTheEnd: true, playedAtTheEnd: [0] })).toEqual(1);
  });
});
