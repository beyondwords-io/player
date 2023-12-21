import diffObject from "../../src/helpers/diffObject";

describe("diffObject", () => {
  it("returns an object containing the previous/current values of changed keys", () => {
    const objBefore = { a: "a", b: "b", c: "c" };
    const objAfter = { a: "a", b: "x", d: "d" };

    expect(diffObject(objBefore, objAfter)).toEqual({
      // a has not changed
      b: { previousValue: "b", currentValue: "x" },
      c: { previousValue: "c", currentValue: undefined },
      d: { previousValue: undefined, currentValue: "d" },
    });
  });
});
