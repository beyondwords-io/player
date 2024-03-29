import throwError from "../../src/helpers/throwError";

describe("throwError", () => {
  it("includes the package name in the error message", () => {
    expect(() => throwError("something")).toThrow(/@beyondwords\/player/);
  });

  it("includes the provided message in the error message", () => {
    expect(() => throwError("something")).toThrow(/something/);
  });

  it("can optionally include helpful context in the error message", () => {
    const context = { target: "#some-id" };
    expect(() => throwError("something", context)).toThrow(/- target: "#some-id"/);
  });

  it("coereces an array of messages into a single message", () => {
    expect(() => throwError(["line 1", "line 2"])).toThrow(/line 1\nline 2/);
  });
});
