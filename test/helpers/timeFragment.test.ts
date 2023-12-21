import timeFragment from "../../src/helpers/timeFragment";

describe("timeFragment", () => {
  it("returns a valid timeFragment according to the Media Fragments URI spec", () => {
    expect(timeFragment(true, 5)).toEqual("#t=5");
    expect(timeFragment(true, 5.12)).toEqual("#t=5.12");
  });

  it("does not return a time fragment if initialTime is 0", () => {
    expect(timeFragment(true, 0)).toEqual("");
  });

  it("does not return a time fragment if initialTime is negative", () => {
    expect(timeFragment(true, -1)).toEqual("");
  });

  it("returns a timeFragment that would cause Safari to show the first frame of video media", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Safari");

    expect(timeFragment(true, 0, "video")).toEqual("#t=0.00001");
    expect(timeFragment(true, -1, "video")).toEqual("#t=0.00001");
    expect(timeFragment(false, 0, "video")).toEqual("#t=0.00001");

    expect(timeFragment(true, 0, "audio")).toEqual(""); // There's no first frame to load for audio media.
    expect(timeFragment(true, 5, "video")).toEqual("#t=5"); // We still want to skip to initialTime if given.
  });
});
