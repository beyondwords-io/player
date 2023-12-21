import ensureProtocol from "../../src/helpers/ensureProtocol";

describe("ensureProtocol", () => {
  it("adds https:// to the start of the URL if it is missing", () => {
    expect(ensureProtocol("example.com")).toEqual("https://example.com");
    expect(ensureProtocol("https://example.com")).toEqual("https://example.com");
    expect(ensureProtocol("http://example.com")).toEqual("http://example.com");
  });

  it("does not error if href is blank", () => {
    expect(ensureProtocol(null)).toEqual(null);
    expect(ensureProtocol("")).toEqual("");
  });
});
