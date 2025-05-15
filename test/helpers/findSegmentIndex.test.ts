import findSegmentIndex from "../../src/helpers/findSegmentIndex";

describe("findSegmentIndex", () => {
  it("finds the index of the segment at a given time", () => {
    const segments = [
      { startTime: 0.05, duration: 1, section: "title" },
      { startTime: 1.1, duration: 1, section: "body" },
    ];

    expect(findSegmentIndex(segments, -Infinity, false)).toEqual(0);
    expect(findSegmentIndex(segments, -1, false)).toEqual(0);
    expect(findSegmentIndex(segments, 0, false)).toEqual(0);
    expect(findSegmentIndex(segments, 0.05, false)).toEqual(0);
    expect(findSegmentIndex(segments, 0.5, false)).toEqual(0);
    expect(findSegmentIndex(segments, 1, false)).toEqual(0);
    expect(findSegmentIndex(segments, 1.05, false)).toEqual(0);
    expect(findSegmentIndex(segments, 1.09, false)).toEqual(0);

    expect(findSegmentIndex(segments, 1.1, false)).toEqual(1);
    expect(findSegmentIndex(segments, 1.5, false)).toEqual(1);
    expect(findSegmentIndex(segments, 2.1, false)).toEqual(1);
    expect(findSegmentIndex(segments, 3, false)).toEqual(1);
    expect(findSegmentIndex(segments, Infinity, false)).toEqual(1);
  });

  it("finds the index of the segment based on the summary", () => {
    const segments = [
      { startTime: 0.05, duration: 1, section: "body" },
      { startTime: 0.05, duration: 1, section: "summary" },
    ];

    expect(findSegmentIndex(segments, 0.5, false)).toEqual(0);
    expect(findSegmentIndex(segments, 0, false)).toEqual(0);
    expect(findSegmentIndex(segments, 2, false)).toEqual(0);

    expect(findSegmentIndex(segments, 0.5, true)).toEqual(1);
    expect(findSegmentIndex(segments, 0, true)).toEqual(1);
    expect(findSegmentIndex(segments, 2, true)).toEqual(1);
  });

  it("returns always -1 if the segments array is empty", () => {
    expect(findSegmentIndex([], -Infinity, false)).toEqual(-1);
    expect(findSegmentIndex([], 0, false)).toEqual(-1);
    expect(findSegmentIndex([], Infinity, false)).toEqual(-1);
  });
});
