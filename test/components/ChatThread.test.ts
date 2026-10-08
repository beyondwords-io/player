import ChatThread from "../../src/components/default_player/ChatThread.svelte";
import { formatAgentAnswer } from "../../src/helpers/agentCitations";
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

const story = (slug: string, title: string) => ({ title, url: `https://publisher.example/${slug}` });

const render = (thread) => {
  const target = document.createElement("div");
  const component = new ChatThread({ target, props: { tokens, thread } });
  return { target, component };
};

const inlineLinks = (target: HTMLElement) => Array.from(target.querySelectorAll<HTMLAnchorElement>(".answer .inline-citation"));

// What a link sits beside: the text before it on its own line.
const lineBefore = (link: Element) => {
  const range = document.createRange();
  range.setStart(link.closest(".answer"), 0);
  range.setEndBefore(link);
  return range.toString().split("\n").at(-1);
};

const whitespaceOnlyTextNodes = (element: Element) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (/^\s+$/.test(walker.currentNode.textContent)) { nodes.push(walker.currentNode); }
  }
  return nodes;
};

describe("ChatThread", () => {
  it("links a finalized HTTPS link beside the sentence that names it", () => {
    const { target, component } = render([
      reply('The newest article is titled "A City story." You can find it at `https://www.cityam.com/latest-story/`.'),
    ]);

    const [link] = inlineLinks(target);
    expect(target.querySelector(".answer")?.textContent).toEqual('The newest article is titled "A City story."');
    expect(inlineLinks(target)).toHaveLength(1);
    expect(link.href).toEqual("https://www.cityam.com/latest-story/");
    expect(link.target).toEqual("_blank");
    expect(link.rel).toEqual("noopener noreferrer");
    expect(link.getAttribute("aria-label")).toEqual("A City story");
    expect(lineBefore(link)).toEqual('The newest article is titled "A City story."');
    expect(target.querySelector(".citations")).toBeNull();
    component.$destroy();
  });

  it("links an external host once finalized but not while it is streaming", () => {
    const { target, component } = render([
      reply("Unknown https://example.com/story"),
      reply("Streaming https://cityam.com/story", { streaming: true }),
    ]);

    expect(target.querySelectorAll(".inline-citation, .citation")).toHaveLength(1);
    expect(target.querySelector(".cursor")).not.toBeNull();
    component.$destroy();
  });

  it("renders structured article citations the answer does not name as trailing pills", () => {
    const url = "https://publisher.example/article";
    const { target, component } = render([
      reply(`Read [the article](${url}).`, { citations: [{ title: "An article", url }] }),
    ]);

    expect(target.querySelector<HTMLAnchorElement>(".citation")?.href).toEqual(url);
    expect(target.querySelectorAll(".citation")).toHaveLength(1);
    expect(target.querySelector(".citation")?.textContent).toContain("An article");
    expect(inlineLinks(target)).toHaveLength(0);
    component.$destroy();
  });

  it("names inline links from numbered article titles", () => {
    const text = [
      "Here are two articles:",
      "1. First article title",
      "https://news.example/first",
      "2. Second article title",
      "https://news.example/second",
    ].join("\n");
    const { target, component } = render([reply(text)]);

    expect(inlineLinks(target).map((link) => link.getAttribute("aria-label"))).toEqual([
      "First article title",
      "Second article title",
    ]);
    expect(target.querySelector(".answer")?.textContent).not.toContain("https://");
    expect(target.querySelector(".citations")).toBeNull();
    component.$destroy();
  });

  it("places each segment's citations right after its text", () => {
    const first = story("first", "First story");
    const second = story("second", "Second story");
    const third = story("third", "Third story");
    const segments = [
      { text: "Here are the headlines:", citations: [] },
      { text: "\n\nThe first story leads today.", citations: [first] },
      { text: "\n\nThe second and third stories follow.", citations: [second, third] },
      { text: "\n\nWant me to read one?", citations: [] },
    ];
    const text = segments.map((segment) => segment.text).join("");
    const { target, component } = render([
      reply(text, { citations: [first, second, third], layout: { segments, trailing: [] } }),
    ]);

    const links = inlineLinks(target);
    expect(links.map((link) => link.href)).toEqual([first.url, second.url, third.url]);
    expect(links.map(lineBefore)).toEqual([
      "The first story leads today.",
      "The second and third stories follow.",
      "The second and third stories follow.",
    ]);
    // The chips sit directly against the sentence and each other.
    expect(links[1].nextSibling).toBe(links[2]);
    expect(links[1].previousSibling?.textContent).toMatch(/follow\.$/);
    expect(target.querySelector(".citations")).toBeNull();
    component.$destroy();
  });

  it("keeps the answer's text identical to the displayed reply", () => {
    const named = story("named", "A named story");
    const segments = [
      { text: "Intro line.", citations: [] },
      { text: "\nA named story is first.", citations: [named] },
      { text: " Then a closing line.", citations: [] },
    ];
    const laidOutText = segments.map((segment) => segment.text).join("");
    const fallbackText = "Introduction\n\n\n\nRead [A City story](https://www.cityam.com/latest-story/) today.\nClosing question?";
    const { target, component } = render([
      reply(laidOutText, { citations: [named], layout: { segments, trailing: [] } }),
      reply(fallbackText),
    ]);

    const answers = Array.from(target.querySelectorAll(".answer"));
    expect(answers.map((answer) => answer.textContent)).toEqual([laidOutText, formatAgentAnswer(fallbackText)]);
    expect(answers.flatMap(whitespaceOnlyTextNodes)).toEqual([]);
    expect(inlineLinks(target).every((link) => link.textContent === "")).toEqual(true);
    component.$destroy();
  });

  it("names inline links and trailing pills by the headline", () => {
    const inline = story("inline", "CP26/35: FCA proposes minimum redemption terms\nThe regulator wants longer notice periods.");
    const trailing = story("trailing", "\nFCA maps three open finance models\nNo pick yet.");
    const segments = [{ text: "CP26/35 proposes minimum redemption terms.", citations: [inline] }];
    const { target, component } = render([
      reply(segments[0].text, { citations: [inline, trailing], layout: { segments, trailing: [trailing] } }),
    ]);

    const [link] = inlineLinks(target);
    expect(link.getAttribute("aria-label")).toEqual("CP26/35: FCA proposes minimum redemption terms");
    expect(link.getAttribute("title")).toEqual("CP26/35: FCA proposes minimum redemption terms");
    expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toEqual("true");
    expect(link.style.getPropertyValue("--border")).toEqual(tokens.citationBorder);
    expect(link.style.color).toEqual(tokens.citation);

    const pill = target.querySelector<HTMLAnchorElement>(".citations .citation");
    expect(pill?.textContent?.trim()).toEqual("FCA maps three open finance models");
    expect(pill?.href).toEqual(trailing.url);
    expect(pill?.target).toEqual("_blank");
    expect(pill?.rel).toEqual("noopener noreferrer");
    component.$destroy();
  });

  it("lays out a row without a layout from the citations it carries", () => {
    const named = { title: "A City story", url: "https://www.cityam.com/latest-story/" };
    const unnamed = { title: "From the article", url: "https://publisher.example/article#segment-3" };
    const { target, component } = render([
      reply('Read "A City story" for the background.', { citations: [named, unnamed] }),
    ]);

    expect(inlineLinks(target).map((link) => link.href)).toEqual([named.url]);
    expect(Array.from(target.querySelectorAll<HTMLAnchorElement>(".citations .citation")).map((pill) => pill.href)).toEqual([unnamed.url]);
    component.$destroy();
  });

  it("does not trust a layout made for other text", () => {
    const cited = story("cited", "A cited story");
    const layout = { segments: [{ text: "The original answer.", citations: [cited] }], trailing: [] };
    const { target, component } = render([reply("The corrected answer.", { citations: [cited], layout })]);

    expect(target.querySelector(".answer")?.textContent).toEqual("The corrected answer.");
    expect(target.querySelectorAll(".inline-citation, .citation")).toHaveLength(1);
    component.$destroy();
  });

  it("renders streaming rows as plain text without citations", () => {
    const cited = story("cited", "A cited story");
    const { target, component } = render([
      reply("A cited story is", { streaming: true, citations: [cited] }),
    ]);

    expect(target.querySelector(".answer")?.textContent).toEqual("A cited story is");
    expect(target.querySelector(".cursor")).not.toBeNull();
    expect(target.querySelectorAll(".inline-citation, .citation")).toHaveLength(0);
    component.$destroy();
  });

  it("caps excessive blank lines without changing the agent's line structure", () => {
    const { target, component } = render([
      reply("Introduction\n\n\n\nFirst line\nstill the same paragraph\n \nClosing question"),
    ]);

    const answer = target.querySelector(".answer");
    expect(answer?.textContent).toEqual(
      "Introduction\n\nFirst line\nstill the same paragraph\n \nClosing question",
    );
    component.$destroy();
  });

  it("does not normalize spacing while a reply is streaming", () => {
    const { target, component } = render([reply("First paragraph\n\n\n\nSecond paragraph", { streaming: true })]);

    expect(target.querySelector(".answer")?.textContent).toContain("First paragraph\n\n\n\nSecond paragraph");
    expect(target.querySelector(".cursor")).not.toBeNull();
    component.$destroy();
  });
});
