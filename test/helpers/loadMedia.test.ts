import { loadMedia } from "../../src/helpers/loadMedia";

describe("loadMedia", () => {
  it("does not call startLoad until the manifest has loaded", () => {
    const startLoad = vi.fn();
    const hls = { manifestLoaded: false, startLoad };

    loadMedia(hls, 0, 1);

    expect(startLoad).not.toHaveBeenCalled();
  });

  it("calls startLoad once the manifest has loaded", () => {
    const startLoad = vi.fn();
    const hls = { manifestLoaded: true, startLoad };

    loadMedia(hls, 0);

    expect(startLoad).toHaveBeenCalledWith(0);
    expect(hls.loadMediaCalled).toEqual(true);
  });

  it("only calls startLoad once", () => {
    const startLoad = vi.fn();
    const hls = { manifestLoaded: true, startLoad };

    loadMedia(hls, 0);
    loadMedia(hls, 0);

    expect(startLoad).toHaveBeenCalledTimes(1);
  });
});
