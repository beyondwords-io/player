import stableSort from "../../src/helpers/stableSort";

describe("stableSort", () => {
  const elements = ["elephant", "cat", "dog", "bat", "giraffe", "ox"];

  const sortByLength = (a, b) => {
    if (a.length < b.length) { return -1; }
    if (a.length > b.length) { return 1; }

    return 0;
  };

  it("returns sorted elements and preserves the original order if two elemenets are deemed equal", () => {
    expect(stableSort(elements, sortByLength)).toEqual(["ox", "cat", "dog", "bat", "giraffe", "elephant"]);
  });

  it("does not mutate the input array", () => {
    stableSort(elements, sortByLength);
    expect(elements).toEqual(["elephant", "cat", "dog", "bat", "giraffe", "ox"]);
  });
});
