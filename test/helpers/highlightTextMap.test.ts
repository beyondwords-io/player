import { buildCharMap, buildWordRanges, findCurrentWordIndex, mergeLineRects } from "../../src/helpers/highlightTextMap";

describe("buildCharMap", () => {
  it("maps each character to its text node and offset", () => {
    const el = document.createElement("p");
    el.textContent = "abc";
    const { charMap, normalizedText } = buildCharMap(el);

    expect(normalizedText).toEqual("abc");
    expect(charMap).toHaveLength(3);
    expect(charMap[0].offset).toEqual(0);
    expect(charMap[2].offset).toEqual(2);
  });

  it("walks multiple text nodes across child elements", () => {
    const el = document.createElement("p");
    el.innerHTML = "Hello <strong>world</strong>!";
    const { charMap, normalizedText } = buildCharMap(el);

    expect(normalizedText).toEqual("Hello world!");
    expect(charMap).toHaveLength(12);
  });

  it("normalizes unicode whitespace to regular spaces", () => {
    const el = document.createElement("p");
    el.textContent = "hello\u00A0world\u2009!";
    const { normalizedText } = buildCharMap(el);

    expect(normalizedText).toEqual("hello world !");
  });

  it("returns empty results for an empty element", () => {
    const el = document.createElement("p");
    const { charMap, normalizedText } = buildCharMap(el);

    expect(charMap).toHaveLength(0);
    expect(normalizedText).toEqual("");
  });
});

describe("buildWordRanges", () => {
  const words = [
    { text: "Hello", startTime: 0, duration: 0.5 },
    { text: "world", startTime: 0.5, duration: 0.5 },
  ];

  it("maps words to character indices in normalized text", () => {
    const ranges = buildWordRanges("Hello world", words);

    expect(ranges).toEqual([
      { startIndex: 0, endIndex: 5, startTime: 0, duration: 500 },
      { startIndex: 6, endIndex: 11, startTime: 500, duration: 500 },
    ]);
  });

  it("skips leading whitespace", () => {
    const ranges = buildWordRanges("  Hello world", words);

    expect(ranges[0].startIndex).toEqual(2);
    expect(ranges[1].startIndex).toEqual(8);
  });

  it("skips words not found in text", () => {
    const ranges = buildWordRanges("Hello world", [
      { text: "Hello", startTime: 0, duration: 0.5 },
      { text: "missing", startTime: 0.5, duration: 0.5 },
      { text: "world", startTime: 1, duration: 0.5 },
    ]);

    expect(ranges).toHaveLength(2);
    expect(ranges[0].endIndex).toEqual(5);
    expect(ranges[1].startIndex).toEqual(6);
  });

  it("handles null/undefined words array", () => {
    expect(buildWordRanges("Hello", null)).toEqual([]);
    expect(buildWordRanges("Hello", undefined)).toEqual([]);
  });

  it("normalizes unicode whitespace in word text", () => {
    const ranges = buildWordRanges("non breaking", [
      { text: "non\u00A0breaking", startTime: 0, duration: 1 },
    ]);

    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toEqual({ startIndex: 0, endIndex: 12, startTime: 0, duration: 1000 });
  });

  it("matches words sequentially to handle repeated words", () => {
    const ranges = buildWordRanges("the dog chased the cat", [
      { text: "the", startTime: 0, duration: 0.2 },
      { text: "dog", startTime: 0.2, duration: 0.3 },
      { text: "chased", startTime: 0.5, duration: 0.3 },
      { text: "the", startTime: 0.8, duration: 0.2 },
      { text: "cat", startTime: 1.0, duration: 0.2 },
    ]);

    expect(ranges).toHaveLength(5);
    expect(ranges[0].startIndex).toEqual(0);
    expect(ranges[3].startIndex).toEqual(15);
  });
});

describe("findCurrentWordIndex", () => {
  const wordRanges = [
    { startTime: 0, duration: 500 },
    { startTime: 500, duration: 300 },
    { startTime: 800, duration: 200 },
  ];

  it("returns the index of the word at the given time", () => {
    expect(findCurrentWordIndex(0, wordRanges)).toEqual(0);
    expect(findCurrentWordIndex(250, wordRanges)).toEqual(0);
    expect(findCurrentWordIndex(499, wordRanges)).toEqual(0);
    expect(findCurrentWordIndex(500, wordRanges)).toEqual(1);
    expect(findCurrentWordIndex(800, wordRanges)).toEqual(2);
  });

  it("returns -1 before the first word and after the last", () => {
    expect(findCurrentWordIndex(-1, wordRanges)).toEqual(-1);
    expect(findCurrentWordIndex(1000, wordRanges)).toEqual(-1);
  });

  it("returns -1 in gaps between words", () => {
    const gapped = [
      { startTime: 0, duration: 100 },
      { startTime: 200, duration: 100 },
    ];

    expect(findCurrentWordIndex(150, gapped)).toEqual(-1);
  });

  it("returns -1 for empty word ranges", () => {
    expect(findCurrentWordIndex(0, [])).toEqual(-1);
  });

  it("handles 0-duration words by extending to next word start", () => {
    const zeroDuration = [
      { startTime: 0, duration: 0 },
      { startTime: 500, duration: 300 },
    ];

    expect(findCurrentWordIndex(0, zeroDuration)).toEqual(0);
    expect(findCurrentWordIndex(250, zeroDuration)).toEqual(0);
    expect(findCurrentWordIndex(499, zeroDuration)).toEqual(0);
    expect(findCurrentWordIndex(500, zeroDuration)).toEqual(1);
  });

  it("handles 0-duration last word by extending to segment end", () => {
    const zeroDurationLast = [
      { startTime: 0, duration: 500 },
      { startTime: 500, duration: 0 },
    ];

    expect(findCurrentWordIndex(500, zeroDurationLast)).toEqual(1);
    expect(findCurrentWordIndex(99999, zeroDurationLast)).toEqual(1);
  });

  it("caps 0-duration last word at segmentDurationMs", () => {
    const zeroDurationLast = [
      { startTime: 0, duration: 500 },
      { startTime: 500, duration: 0 },
    ];

    expect(findCurrentWordIndex(500, zeroDurationLast, 600)).toEqual(1);
    expect(findCurrentWordIndex(599, zeroDurationLast, 600)).toEqual(1);
    expect(findCurrentWordIndex(600, zeroDurationLast, 600)).toEqual(-1);
    expect(findCurrentWordIndex(99999, zeroDurationLast, 600)).toEqual(-1);
  });

  it("handles all 0-duration words", () => {
    const allZero = [
      { startTime: 0, duration: 0 },
      { startTime: 200, duration: 0 },
      { startTime: 400, duration: 0 },
    ];

    expect(findCurrentWordIndex(0, allZero)).toEqual(0);
    expect(findCurrentWordIndex(100, allZero)).toEqual(0);
    expect(findCurrentWordIndex(200, allZero)).toEqual(1);
    expect(findCurrentWordIndex(400, allZero)).toEqual(2);
    expect(findCurrentWordIndex(1000, allZero)).toEqual(2);
  });

  it("caps all 0-duration words at segmentDurationMs", () => {
    const allZero = [
      { startTime: 0, duration: 0 },
      { startTime: 200, duration: 0 },
      { startTime: 400, duration: 0 },
    ];

    expect(findCurrentWordIndex(400, allZero, 500)).toEqual(2);
    expect(findCurrentWordIndex(499, allZero, 500)).toEqual(2);
    expect(findCurrentWordIndex(500, allZero, 500)).toEqual(-1);
  });
});

describe("mergeLineRects", () => {
  const container = { left: 0, top: 0 };

  it("returns empty for empty input", () => {
    expect(mergeLineRects([], container)).toEqual([]);
  });

  it("filters out zero-size rects", () => {
    const rects = [
      { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 },
      { left: 10, top: 10, right: 50, bottom: 30, width: 40, height: 20 },
    ];

    const result = mergeLineRects(rects, container);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 10, y: 10, width: 40, height: 20 });
  });

  it("merges rects on the same line", () => {
    const rects = [
      { left: 0, top: 10, right: 50, bottom: 30, width: 50, height: 20 },
      { left: 50, top: 10, right: 100, bottom: 30, width: 50, height: 20 },
    ];

    const result = mergeLineRects(rects, container);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 0, y: 10, width: 100, height: 20 });
  });

  it("keeps rects on different lines separate", () => {
    const rects = [
      { left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 },
      { left: 0, top: 25, right: 80, bottom: 45, width: 80, height: 20 },
    ];

    const result = mergeLineRects(rects, container);
    expect(result).toHaveLength(2);
  });

  it("offsets by container position", () => {
    const offset = { left: 100, top: 50 };
    const rects = [
      { left: 110, top: 60, right: 150, bottom: 80, width: 40, height: 20 },
    ];

    const result = mergeLineRects(rects, offset);
    expect(result[0]).toEqual({ x: 10, y: 10, width: 40, height: 20 });
  });

  it("merges overlapping inline element rects on the same line", () => {
    const rects = [
      { left: 0, top: 10, right: 30, bottom: 30, width: 30, height: 20 },
      { left: 25, top: 10, right: 60, bottom: 30, width: 35, height: 20 },
      { left: 55, top: 10, right: 100, bottom: 30, width: 45, height: 20 },
    ];

    const result = mergeLineRects(rects, container);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 0, y: 10, width: 100, height: 20 });
  });
});
