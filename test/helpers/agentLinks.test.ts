import {
  agentCitationKey,
  agentCitationsFromText,
  agentCitationsFromToolResult,
  agentTextWithoutLinks,
  mergeAgentCitations,
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

  it("titles a tool result by the first line of a multi-line title", () => {
    const result = [{
      type: "text",
      text: JSON.stringify({
        articles: [
          {
            title: "Gambling giant blames job cuts on Burnham high street crackdown\nGambling shops part of high street fabric",
            sourceUrl: "https://www.cityam.com/gambling-giant-blames-job-cuts-on-burnham-high-street-crackdown/",
          },
          { title: "\n  Leading blank line\nSubheading", sourceUrl: "https://news.example/blank" },
          { title: "  ", sourceUrl: "https://news.example/untitled" },
        ],
      }),
    }];

    expect(agentCitationsFromToolResult(result)).toEqual([
      { title: "Gambling giant blames job cuts on Burnham high street crackdown", url: "https://www.cityam.com/gambling-giant-blames-job-cuts-on-burnham-high-street-crackdown/" },
      { title: "Leading blank line", url: "https://news.example/blank" },
      { title: "news.example", url: "https://news.example/untitled" },
    ]);
  });

  it("titles a link whose label names nothing from the line it sits on", () => {
    expect(agentCitationsFromText([
      "The FCA proposes minimum redemption terms for NURS funds (read it [here](https://news.example/nurs)).",
      "1. Victoria Beckham owed £350,000 by Harvey Nichols",
      "[Read more](https://news.example/beckham)",
      "[The full story](https://news.example/untitled)",
    ].join("\n"))).toEqual([
      { title: "The FCA proposes minimum redemption terms for NURS funds", url: "https://news.example/nurs" },
      { title: "Victoria Beckham owed £350,000 by Harvey Nichols", url: "https://news.example/beckham" },
      { title: "news.example", url: "https://news.example/untitled" },
    ]);
  });

  it("knows one article by its link whatever the agent did to it", () => {
    expect(new Set([
      "https://news.example/prism/x/",
      "https://news.example/prism/x",
      "https://www.news.example/prism/x?utm_source=agent&utm_medium=chat",
    ].map(agentCitationKey)).size).toEqual(1);
    expect(agentCitationKey("https://news.example/prism/x?page=2")).not.toEqual(agentCitationKey("https://news.example/prism/x"));
    expect(agentCitationKey("https://publisher.example/article#segment-3")).not.toEqual(agentCitationKey("https://publisher.example/article#segment-5"));

    expect(mergeAgentCitations(
      [{ title: "PRISM", url: "https://news.example/prism/x/" }],
      [{ title: "PRISM again", url: "https://news.example/prism/x" }],
    )).toEqual([{ title: "PRISM", url: "https://news.example/prism/x/" }]);
  });
});
