import {
  agentCitationsFromText,
  agentCitationsFromToolResult,
  agentTextWithoutLinks,
  citationsForAgentText,
} from "../../src/helpers/agentLinks";

describe("agentLinks", () => {
  it("removes a long bare URL and its introductory clause from answer copy", () => {
    expect(agentTextWithoutLinks(
      'The newest article is titled "Victoria Beckham owed £350,000 by Harvey Nichols." You can find it at https://www.cityam.com/victoria-beckham/.',
    )).toEqual('The newest article is titled "Victoria Beckham owed £350,000 by Harvey Nichols."');
  });

  it("keeps Markdown link labels in the answer copy", () => {
    expect(agentTextWithoutLinks(
      "Read [the latest story](https://cityam.com/latest-story).",
    )).toEqual("Read the latest story.");
  });

  it("promotes an inline URL to a citation using the nearest quoted title", () => {
    expect(agentCitationsFromText(
      'The newest article is titled "Victoria Beckham owed £350,000 by Harvey Nichols." You can find it at https://www.cityam.com/victoria-beckham/.',
    )).toEqual([{
      title: "Victoria Beckham owed £350,000 by Harvey Nichols",
      url: "https://www.cityam.com/victoria-beckham/",
    }]);
  });

  it("uses a Markdown label or hostname when there is no quoted title", () => {
    expect(agentCitationsFromText(
      "Read [the full investigation](https://news.example/investigation) or https://another.example/story.",
    )).toEqual([
      { title: "the full investigation", url: "https://news.example/investigation" },
      { title: "another.example", url: "https://another.example/story" },
    ]);
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

});
