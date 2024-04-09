import findSegmentIndex from "../../src/helpers/findSegmentIndex";

describe("findSegmentIndex", () => {
  it("finds the index of the segment at a given time", () => {
    const segments = [
      { startTime: 0.05, duration: 1, section: "title" },
      { startTime: 1.1, duration: 1, section: "body" },
    ];

    expect(findSegmentIndex(segments, -Infinity, "article")).toEqual(0);
    expect(findSegmentIndex(segments, -1, "article")).toEqual(0);
    expect(findSegmentIndex(segments, 0, "article")).toEqual(0);
    expect(findSegmentIndex(segments, 0.05, "article")).toEqual(0);
    expect(findSegmentIndex(segments, 0.5, "article")).toEqual(0);
    expect(findSegmentIndex(segments, 1, "article")).toEqual(0);
    expect(findSegmentIndex(segments, 1.05, "article")).toEqual(0);
    expect(findSegmentIndex(segments, 1.09, "article")).toEqual(0);

    expect(findSegmentIndex(segments, 1.1, "article")).toEqual(1);
    expect(findSegmentIndex(segments, 1.5, "article")).toEqual(1);
    expect(findSegmentIndex(segments, 2.1, "article")).toEqual(1);
    expect(findSegmentIndex(segments, 3, "article")).toEqual(1);
    expect(findSegmentIndex(segments, Infinity, "article")).toEqual(1);
  });

  it("finds the index of the segment based on the content variant", () => {
    const segments = [
      { startTime: 0.05, duration: 1, section: "body" },
      { startTime: 0.05, duration: 1, section: "summary" },
    ];

    expect(findSegmentIndex(segments, 0.5, "article")).toEqual(0);
    expect(findSegmentIndex(segments, 0, "article")).toEqual(0);
    expect(findSegmentIndex(segments, 2, "article")).toEqual(0);

    expect(findSegmentIndex(segments, 0.5, "summary")).toEqual(1);
    expect(findSegmentIndex(segments, 0, "summary")).toEqual(1);
    expect(findSegmentIndex(segments, 2, "summary")).toEqual(1);
  });

  it("returns always -1 if the segments array is empty", () => {
    expect(findSegmentIndex([], -Infinity, "article")).toEqual(-1);
    expect(findSegmentIndex([], 0, "article")).toEqual(-1);
    expect(findSegmentIndex([], Infinity, "article")).toEqual(-1);
  });
});
