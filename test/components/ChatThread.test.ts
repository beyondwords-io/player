import ChatThread from "../../src/components/default_player/ChatThread.svelte";
import deriveTokens from "../../src/helpers/default_theme/deriveTokens";

const tokens = deriveTokens({ palette: {
  backgroundColor: "white",
  textColor: "black",
  linkColor: "purple",
} });

const reply = (text: string, overrides = {}) => ({
  role: "agent",
  text,
  citations: [],
  streaming: false,
  typing: false,
  spoken: false,
  ...overrides,
});

describe("ChatThread", () => {
  it("promotes a finalized HTTPS link into a citation pill", () => {
    const target = document.createElement("div");
    const component = new ChatThread({
      target,
      props: {
        tokens,
        thread: [reply('The newest article is titled "A City story." You can find it at `https://www.cityam.com/latest-story/`.')],
      },
    });

    const citation = target.querySelector<HTMLAnchorElement>(".citation");
    expect(target.querySelector(".answer")?.textContent).toEqual('The newest article is titled "A City story."');
    expect(citation?.textContent).toContain("A City story");
    expect(citation?.href).toEqual("https://www.cityam.com/latest-story/");
    expect(citation?.target).toEqual("_blank");
    expect(citation?.rel).toEqual("noopener noreferrer");
    component.$destroy();
  });

  it("links an external host once finalized but not while it is streaming", () => {
    const target = document.createElement("div");
    const component = new ChatThread({
      target,
      props: {
        tokens,
        thread: [
          reply("Unknown https://example.com/story"),
          reply("Streaming https://cityam.com/story", { streaming: true }),
        ],
      },
    });

    expect(target.querySelectorAll(".citation")).toHaveLength(1);
    expect(target.querySelector(".cursor")).not.toBeNull();
    component.$destroy();
  });

  it("renders structured article citations and trusts their hosts for inline links", () => {
    const target = document.createElement("div");
    const url = "https://publisher.example/article";
    const component = new ChatThread({
      target,
      props: {
        tokens,
        thread: [reply(`Read [the article](${url}).`, {
          citations: [{ title: "An article", url }],
        })],
      },
    });

    expect(target.querySelector<HTMLAnchorElement>(".citation")?.href).toEqual(url);
    expect(target.querySelectorAll(".citation")).toHaveLength(1);
    expect(target.querySelector(".citation")?.textContent).toContain("An article");
    component.$destroy();
  });
});
