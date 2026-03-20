import rewriteMediaUrl from "../../src/helpers/rewriteMediaUrl";

describe("rewriteMediaUrl", () => {
  it("replaces the hostname of a media URL", () => {
    const url = "https://cdn.beyondwords.io/audio/file.mp3";
    expect(rewriteMediaUrl(url, "bw.example.com")).toBe("https://bw.example.com/audio/file.mp3");
  });

  it("preserves the path, query, and fragment", () => {
    const url = "https://cdn.beyondwords.io/audio/file.mp3?token=abc#start";
    expect(rewriteMediaUrl(url, "bw.example.com")).toBe("https://bw.example.com/audio/file.mp3?token=abc#start");
  });

  it("preserves the protocol", () => {
    const url = "http://cdn.beyondwords.io/video/file.mp4";
    expect(rewriteMediaUrl(url, "bw.example.com")).toBe("http://bw.example.com/video/file.mp4");
  });

  it("returns the original URL when mediaCustomUrl is undefined", () => {
    const url = "https://cdn.beyondwords.io/audio/file.mp3";
    expect(rewriteMediaUrl(url, undefined)).toBe(url);
  });

  it("returns the original URL when mediaCustomUrl is empty", () => {
    const url = "https://cdn.beyondwords.io/audio/file.mp3";
    expect(rewriteMediaUrl(url, "")).toBe(url);
  });

  it("returns the original URL when url is undefined", () => {
    expect(rewriteMediaUrl(undefined, "bw.example.com")).toBeUndefined();
  });

  it("returns the original URL when url is null", () => {
    expect(rewriteMediaUrl(null, "bw.example.com")).toBeNull();
  });

  it("does not rewrite blob URLs", () => {
    const url = "blob:https://example.com/abc-123";
    expect(rewriteMediaUrl(url, "bw.example.com")).toBe(url);
  });

  it("returns the original URL for invalid URLs", () => {
    const url = "not-a-url";
    expect(rewriteMediaUrl(url, "bw.example.com")).toBe(url);
  });

  it("works with any hostname, not just cdn.beyondwords.io", () => {
    const url = "https://some-other-cdn.example.com/audio/file.mp3";
    expect(rewriteMediaUrl(url, "bw.example.com")).toBe("https://bw.example.com/audio/file.mp3");
  });

  it("handles URLs with ports", () => {
    const url = "https://cdn.beyondwords.io:8080/audio/file.mp3";
    expect(rewriteMediaUrl(url, "bw.example.com")).toBe("https://bw.example.com/audio/file.mp3");
  });

  it("applies the port when mediaCustomUrl contains a port", () => {
    const url = "https://cdn.beyondwords.io/audio/file.mp3";
    expect(rewriteMediaUrl(url, "bw.example.com:8080")).toBe("https://bw.example.com:8080/audio/file.mp3");
  });
});
