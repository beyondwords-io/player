import findSegmentIndex from "../../src/helpers/findSegmentIndex";

describe("findSegmentIndex", () => {
  it("finds the index of the segment at a given time", () => {
    const segments = [
      { startTime: 0.05, duration: 1 },
      { startTime: 1.1, duration: 1 },
    ]

    expect(findSegmentIndex(segments, -Infinity)).toEqual(0);
    expect(findSegmentIndex(segments, -1)).toEqual(0);
    expect(findSegmentIndex(segments, 0)).toEqual(0);
    expect(findSegmentIndex(segments, 0.05)).toEqual(0);
    expect(findSegmentIndex(segments, 0.5)).toEqual(0);
    expect(findSegmentIndex(segments, 1)).toEqual(0);
    expect(findSegmentIndex(segments, 1.05)).toEqual(0);
    expect(findSegmentIndex(segments, 1.09)).toEqual(0);

    expect(findSegmentIndex(segments, 1.1)).toEqual(1);
    expect(findSegmentIndex(segments, 1.5)).toEqual(1);
    expect(findSegmentIndex(segments, 2.1)).toEqual(1);
    expect(findSegmentIndex(segments, 3)).toEqual(1);
    expect(findSegmentIndex(segments, Infinity)).toEqual(1);
  });

  it("returns always -1 if the segments array is empty", () => {
    expect(findSegmentIndex([], -Infinity)).toEqual(-1);
    expect(findSegmentIndex([], 0)).toEqual(-1);
    expect(findSegmentIndex([], Infinity)).toEqual(-1);
  });
});
