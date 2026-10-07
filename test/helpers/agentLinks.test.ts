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

  it("removes a dangling connector when a single article URL becomes a pill", () => {
    const text = 'The newest article is titled "Victoria Beckham owed £350,000 by Harvey Nichols" and https://www.cityam.com/victoria-beckham-owed-350000-by-harvey-nichols/.';

    expect(agentTextWithoutLinks(text)).toEqual(
      'The newest article is titled "Victoria Beckham owed £350,000 by Harvey Nichols".',
    );
    expect(agentCitationsFromText(text)).toEqual([{
      title: "Victoria Beckham owed £350,000 by Harvey Nichols",
      url: "https://www.cityam.com/victoria-beckham-owed-350000-by-harvey-nichols/",
    }]);
  });

  it("uses each numbered article title for its corresponding citation", () => {
    const text = [
      "Here are five of the latest articles from City AM:",
      "",
      "1. Victoria Beckham owed £350,000 by Harvey Nichols https://www.cityam.com/victoria-beckham/",
      "2. Bank of England’s Pill warns against ‘wait and see’ interest rates approach https://www.cityam.com/bank-of-england/",
      "3. Nike becomes London City Lionesses sponsor as well as kit partner in world record deal https://www.cityam.com/nike-lionesses/",
      "4. Revolut takes step closer to US bank launch after clearing key regulatory hurdle https://www.cityam.com/revolut-us-bank/",
      "5. Reform UK chiefs ask to meet gilt holders amid bond rout https://www.cityam.com/reform-uk/",
    ].join("\n");

    expect(agentCitationsFromText(text)).toEqual([
      { title: "Victoria Beckham owed £350,000 by Harvey Nichols", url: "https://www.cityam.com/victoria-beckham/" },
      { title: "Bank of England’s Pill warns against ‘wait and see’ interest rates approach", url: "https://www.cityam.com/bank-of-england/" },
      { title: "Nike becomes London City Lionesses sponsor as well as kit partner in world record deal", url: "https://www.cityam.com/nike-lionesses/" },
      { title: "Revolut takes step closer to US bank launch after clearing key regulatory hurdle", url: "https://www.cityam.com/revolut-us-bank/" },
      { title: "Reform UK chiefs ask to meet gilt holders amid bond rout", url: "https://www.cityam.com/reform-uk/" },
    ]);
    expect(agentTextWithoutLinks(text)).not.toContain("https://");
  });

  it("pairs URL-only lines with the article title above and removes the vacated lines", () => {
    const text = [
      "Here are two articles:",
      "",
      "Bank of England’s Pill warns against ‘wait and see’ interest rates approach",
      "https://www.cityam.com/bank-of-england/",
      "Nike becomes London City Lionesses sponsor in world record deal",
      "https://www.cityam.com/nike-lionesses/",
    ].join("\n");

    expect(agentCitationsFromText(text)).toEqual([
      { title: "Bank of England’s Pill warns against ‘wait and see’ interest rates approach", url: "https://www.cityam.com/bank-of-england/" },
      { title: "Nike becomes London City Lionesses sponsor in world record deal", url: "https://www.cityam.com/nike-lionesses/" },
    ]);
    expect(agentTextWithoutLinks(text)).toEqual([
      "Here are two articles:",
      "",
      "Bank of England’s Pill warns against ‘wait and see’ interest rates approach",
      "Nike becomes London City Lionesses sponsor in world record deal",
    ].join("\n"));
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
