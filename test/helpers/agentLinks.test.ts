import {
  agentCitationsFromToolResult,
  agentTextParts,
  citationsForAgentText,
  linkHostsFromUrls,
} from "../../src/helpers/agentLinks";

describe("agentLinks", () => {
  it("links approved HTTPS URLs and leaves their punctuation outside", () => {
    expect(agentTextParts(
      "Read https://www.cityam.com/latest-story/.",
      ["cityam.com"],
    )).toEqual([
      { kind: "text", text: "Read " },
      { kind: "link", text: "https://www.cityam.com/latest-story/", href: "https://www.cityam.com/latest-story/" },
      { kind: "text", text: "." },
    ]);
  });

  it("renders approved Markdown labels and normalizes www hosts", () => {
    expect(agentTextParts(
      "Read [the latest story](https://cityam.com/latest-story).",
      ["www.cityam.com"],
    )).toEqual([
      { kind: "text", text: "Read " },
      { kind: "link", text: "the latest story", href: "https://cityam.com/latest-story" },
      { kind: "text", text: "." },
    ]);
  });

  it("turns ElevenLabs inline-code URLs into clean links", () => {
    expect(agentTextParts(
      "The link is: `https://www.cityam.com/latest-story/`",
      ["cityam.com"],
    )).toEqual([
      { kind: "text", text: "The link is: " },
      { kind: "link", text: "https://www.cityam.com/latest-story/", href: "https://www.cityam.com/latest-story/" },
    ]);
  });

  it("keeps unknown and non-HTTPS URLs as text", () => {
    expect(agentTextParts(
      "Unknown https://example.com/story and http://cityam.com/story.",
      ["cityam.com"],
    )).toEqual([{ kind: "text", text: "Unknown https://example.com/story and http://cityam.com/story." }]);
  });

  it("extracts and deduplicates article citations from nested MCP results", () => {
    const result = [{
      type: "text",
      text: JSON.stringify({
        articles: [
          { title: "First story", sourceUrl: "https://news.example/first" },
          { title: "First story again", source_url: "https://news.example/first" },
          { title: "Insecure", sourceUrl: "http://news.example/insecure" },
          { title: "Media URL only", url: "https://news.example/media.jpg" },
        ],
      }),
    }];

    expect(agentCitationsFromToolResult(result)).toEqual([
      { title: "First story", url: "https://news.example/first" },
    ]);
  });

  it("selects the cited result when a tool returned several articles", () => {
    const candidates = [
      { title: "First story", url: "https://news.example/first" },
      { title: "Second story", url: "https://news.example/second" },
    ];

    expect(citationsForAgentText("The Second story has the latest details.", candidates)).toEqual([
      candidates[1],
    ]);
    expect(citationsForAgentText("See https://news.example/first for more.", candidates)).toEqual([
      candidates[0],
    ]);
  });

  it("uses a sole tool result even when the answer paraphrases its title", () => {
    const candidate = { title: "A long headline", url: "https://news.example/story" };
    expect(citationsForAgentText("Here is the article you asked for.", [candidate])).toEqual([candidate]);
  });

  it("derives unique approved hosts only from HTTPS source URLs", () => {
    expect(linkHostsFromUrls([
      "https://www.cityam.com/one",
      "https://cityam.com/two",
      "http://unsafe.example/story",
      undefined,
    ])).toEqual(["cityam.com"]);
  });
});
