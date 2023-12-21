import basename from "../../src/helpers/basename";

describe("basename", () => {
  it("returns the basename of the file path", () => {
    expect(basename("file")).toEqual("file");
    expect(basename("file.json")).toEqual("file");
    expect(basename("/file.json")).toEqual("file");
    expect(basename("./file.json")).toEqual("file");
    expect(basename("./a/b/c/file.json")).toEqual("file");
    expect(basename("https://example.com/a/b/c/file.json")).toEqual("file");
  });
});
