import fs from "node:fs";
import BeyondWords from "../../src/index";

// A built bundle only injects the player CSS when a mounted component imports
// the loadTheStyles marker, and Player.styleLoaded() is also what un-hides the
// target. Without it a default-style embed is invisible in production, which
// dev and the screenshot suites both mask because a control panel is mounted.
describe("the default player style", () => {
  const content = [{ title: "Something", audio: [{ id: 1, url: "http://example.com/audio.mp3", contentType: "audio/mpeg", duration: 30 }] }];

  beforeEach(() => {
    HTMLMediaElement.prototype.pause = () => {};
    HTMLMediaElement.prototype.load = () => {};
    window.matchMedia ||= () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });

    BeyondWords.Player.destroyAll();
    delete BeyondWords.Player._styleLoaded;
  });

  it("loads the styles and un-hides the target, with no control panel", async () => {
    const target = document.createElement("div");
    document.body.appendChild(target);

    const player = new BeyondWords.Player({ target, playerStyle: "default", content });

    expect(player.target.style.display).toEqual("none");

    await vi.waitFor(() => expect(BeyondWords.Player._styleLoaded).toEqual(true));
    expect(player.target.style.display).toEqual("");
  });

  // The behavioural test above can only cover whichever component mounts first,
  // because the marker module's side effect runs once per module registry. Both
  // entry points need the import, so assert on both directly.
  it("imports the style marker from every component that can mount first", () => {
    ["DefaultInterface", "Skeleton"].forEach((name) => {
      const source = fs.readFileSync(`src/components/default_player/${name}.svelte`, "utf8");

      // Must be its own statement: bin/vendor_style rewrites one match per line.
      expect(source).toMatch(/^\s*import\("\.\.\/\.\.\/helpers\/loadTheStyles\.ts"\);$/m);
    });
  });
});
