import belowBreakpoint from "../../src/helpers/belowBreakpoint";

describe("belowBreakpoint", () => {
  it("returns true if the standard player style has a width below 380px", () => {
    expect(belowBreakpoint({ playerStyle: "standard", width: 379 })).toEqual(true);
    expect(belowBreakpoint({ playerStyle: "standard", width: 380 })).toEqual(false);
  });

  it("returns true if the large player style has a width below 380px", () => {
    expect(belowBreakpoint({ playerStyle: "large", width: 379 })).toEqual(true);
    expect(belowBreakpoint({ playerStyle: "large", width: 380 })).toEqual(false);
  });

  it("returns true if the video player style has a width below 480px", () => {
    expect(belowBreakpoint({ playerStyle: "video", width: 479 })).toEqual(true);
    expect(belowBreakpoint({ playerStyle: "video", width: 480 })).toEqual(false);
  });

  it("returns true if the screen player style has a width below 640px", () => {
    expect(belowBreakpoint({ playerStyle: "screen", width: 639 })).toEqual(true);
    expect(belowBreakpoint({ playerStyle: "screen", width: 640 })).toEqual(false);
  });
});
