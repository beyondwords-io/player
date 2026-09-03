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
  it("renders finalized links for the publisher's approved source host", () => {
    const target = document.createElement("div");
    const component = new ChatThread({
      target,
      props: {
        tokens,
        linkHosts: ["cityam.com"],
        thread: [reply("The link is https://www.cityam.com/latest-story/.")],
      },
    });

    const link = target.querySelector<HTMLAnchorElement>(".answer-link");
    expect(link?.textContent).toEqual("https://www.cityam.com/latest-story/");
    expect(link?.href).toEqual("https://www.cityam.com/latest-story/");
    expect(link?.target).toEqual("_blank");
    expect(link?.rel).toEqual("noopener noreferrer");
    expect(target.querySelector(".answer")?.textContent).toEqual("The link is https://www.cityam.com/latest-story/.");
    component.$destroy();
  });

  it("does not link an unknown host or text that is still streaming", () => {
    const target = document.createElement("div");
    const component = new ChatThread({
      target,
      props: {
        tokens,
        linkHosts: ["cityam.com"],
        thread: [
          reply("Unknown https://example.com/story"),
          reply("Streaming https://cityam.com/story", { streaming: true }),
        ],
      },
    });

    expect(target.querySelector(".answer-link")).toBeNull();
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

    expect(target.querySelector<HTMLAnchorElement>(".answer-link")?.href).toEqual(url);
    expect(target.querySelector<HTMLAnchorElement>(".citation")?.href).toEqual(url);
    expect(target.querySelector(".citation")?.textContent).toContain("An article");
    component.$destroy();
  });
});
