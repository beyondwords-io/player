import type { AgentCitation, AgentReplyLayout } from "../../src/helpers/agentContracts";
import { formatAgentAnswer, layoutAgentReply } from "../../src/helpers/agentCitations";
import { ARTICLES, CORPUS } from "../fixtures/agentCitationsCorpus";
import type { CorpusCase } from "../fixtures/agentCitationsCorpus";

const article = (key: string): AgentCitation => ARTICLES[key];
const headline = (key: string): AgentCitation => ({ title: ARTICLES[key].title.split("\n")[0], url: ARTICLES[key].url });
const keyOf = new Map(Object.entries(ARTICLES).map(([key, { url }]) => [url, key]));

const joined = (layout: AgentReplyLayout) => layout.segments.map(({ text }) => text).join("");

// Each cited segment ends where its citations sit: [segment text, keys].
const cited = (layout: AgentReplyLayout) => layout.segments
  .filter(({ citations }) => citations.length > 0)
  .map(({ text, citations }) => [text.trim(), citations.map(({ url }) => keyOf.get(url) || url)]);

describe("formatAgentAnswer", () => {
  it("moves bare URLs out of the copy and caps runs of empty lines", () => {
    expect(formatAgentAnswer("First line\n\n\n\nSecond line https://news.example/story")).toEqual(
      "First line\n\nSecond line",
    );
  });

  it("keeps an answer without links as written", () => {
    expect(formatAgentAnswer("One.\n\nTwo.\n")).toEqual("One.\n\nTwo.\n");
  });
});

describe("layoutAgentReply", () => {
  it("cites each verbatim headline after its own line, before the line break", () => {
    const text = [
      "Here are the latest headlines:",
      "",
      "CP26/35: FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets",
      "",
      "FCA's PRISM Taskforce sets out what open finance actually needs to work",
      "",
      "Let me know if you'd like more.",
    ].join("\n");
    const layout = layoutAgentReply(text, { sources: [article("cp35"), article("prism"), article("ofmaps")] });

    expect(joined(layout)).toEqual(text);
    expect(layout.segments.map(({ text: segment, citations }) => [segment, citations])).toEqual([
      ["Here are the latest headlines:\n\nCP26/35: FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets", [article("cp35")]],
      ["\n\nFCA's PRISM Taskforce sets out what open finance actually needs to work", [article("prism")]],
      ["\n\nLet me know if you'd like more.", []],
    ]);
    expect(layout.trailing).toEqual([]);
  });

  it("matches headlines regardless of case, quotes, dashes and possessives", () => {
    const layout = layoutAgentReply(
      "Bank of England's Pill warns against \"wait and see\" interest-rates approach — read on.",
      { sources: [article("pill"), article("boeraise")] },
    );

    expect(cited(layout)).toEqual([
      ["Bank of England's Pill warns against \"wait and see\" interest-rates approach — read on.", ["pill"]],
    ]);
  });

  it("names a story by the first line of a multi-line title", () => {
    const layout = layoutAgentReply(
      "Gambling giant blames job cuts on Burnham high street crackdown.",
      { sources: [article("gambling")] },
    );

    expect(layout.segments[0].citations).toEqual([headline("gambling")]);
  });

  it("anchors a headline that spans two sentences at the one where it ends", () => {
    const text = "FCA consults on equity market transparency and SI regime changes (CP26/30). Responses close 16 October 2026. Anything else?";
    const layout = layoutAgentReply(text, { sources: [article("cp30"), article("cp20")] });

    expect(cited(layout)).toEqual([
      ["FCA consults on equity market transparency and SI regime changes (CP26/30). Responses close 16 October 2026.", ["cp30"]],
    ]);
    expect(joined(layout)).toEqual(text);
  });

  it("orders several citations in one sentence by where each is mentioned", () => {
    const layout = layoutAgentReply(
      "There are two newer ones, CP26/34 on transaction reporting and CP26/35 on NURS funds. Want either?",
      { sources: [article("cp35"), article("cp34")] },
    );

    expect(cited(layout)).toEqual([
      ["There are two newer ones, CP26/34 on transaction reporting and CP26/35 on NURS funds.", ["cp34", "cp35"]],
    ]);
  });

  it("places each source once, beside the sentence that names it best", () => {
    const layout = layoutAgentReply(
      "I found CP26/32 and more.\n\nCP26/32 covers fractional shares and crypto venue deferrals, closing 12 October.",
      { sources: [article("cp32")] },
    );

    expect(cited(layout)).toEqual([
      ["I found CP26/32 and more.\n\nCP26/32 covers fractional shares and crypto venue deferrals, closing 12 October.", ["cp32"]],
    ]);
  });

  it("does not split sentences after abbreviations or initials", () => {
    const text = "Mr. Odey lost at the Upper Tribunal, which confirmed his industry ban and cut the fine to £1.53m. J. K. Rowling is not in this one.";
    const layout = layoutAgentReply(text, { sources: [article("odey")] });

    expect(cited(layout)).toEqual([
      ["Mr. Odey lost at the Upper Tribunal, which confirmed his industry ban and cut the fine to £1.53m.", ["odey"]],
    ]);
  });

  it("drops sources no sentence names", () => {
    const layout = layoutAgentReply("I'll pull up the latest stories for you.", {
      sources: [article("cp35"), article("prism")],
    });

    expect(layout).toEqual({
      segments: [{ text: "I'll pull up the latest stories for you.", citations: [] }],
      trailing: [],
    });
  });

  it("shows explicit citations inline when named and trailing otherwise", () => {
    const layout = layoutAgentReply("WH Smith warns on profit again as discounting hits margins. That's all for now.", {
      explicit: [article("winkworth"), article("whsmith")],
    });

    expect(cited(layout)).toEqual([["WH Smith warns on profit again as discounting hits margins.", ["whsmith"]]]);
    expect(layout.trailing).toEqual([headline("winkworth")]);
  });

  it("keeps links the agent wrote, titled from a matching source", () => {
    const layout = layoutAgentReply(
      "Spurs news is in.\n\nhttps://www.cityam.com/spurs-owners-take-12-month-investment-to-300m-with-fresh-120m-injection/",
      { sources: [article("spurs")] },
    );

    expect(cited(layout)).toEqual([["Spurs news is in.", ["spurs"]]]);
    expect(layout.segments[0].citations).toEqual([headline("spurs")]);
    expect(joined(layout)).toEqual("Spurs news is in.");
  });

  it("leaves a written link trailing when no sentence names it", () => {
    const layout = layoutAgentReply("Sources: https://news.example/a and https://news.example/b", {});

    expect(layout.trailing).toEqual([{ title: "news.example", url: "https://news.example/b" }]);
  });

  it("shows the fallback only when nothing else is cited", () => {
    const summary = "The FCA wants views on how firms should prepare. It's a short read.";
    expect(layoutAgentReply(summary, { sources: [article("cp34")], fallback: article("cp34") }).trailing).toEqual([
      headline("cp34"),
    ]);

    const named = layoutAgentReply("CP26/34 is open until 6 November.", { sources: [article("cp34")], fallback: article("cp35") });
    expect(named.trailing).toEqual([]);
    expect(cited(named)).toEqual([["CP26/34 is open until 6 November.", ["cp34"]]]);

    const explicit = layoutAgentReply(summary, { explicit: [article("prism")], fallback: article("cp34") });
    expect(explicit.trailing).toEqual([headline("prism")]);
  });

  it("ignores a fallback that is not https", () => {
    expect(layoutAgentReply("A summary.", { fallback: { title: "Story", url: "http://news.example/story" } }).trailing).toEqual([]);
  });

  it("keeps the join invariant for blank, trailing-space and link-only replies", () => {
    [
      "",
      "   ",
      "Trailing space. \n",
      "https://news.example/only",
      "Line one\r\nLine two.  Next sentence!\n\n\n\n\"Quoted.\" Then more…",
      "1. CP26/35: FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets\n2. Second item",
    ].forEach((text) => {
      const layout = layoutAgentReply(text, { sources: [article("cp35")] });
      expect(joined(layout)).toEqual(formatAgentAnswer(text));
      expect(layout.segments.length).toBeGreaterThan(0);
    });
  });

  it("cites a link the agent wrote where it wrote it, whatever its label says", () => {
    const text = [
      "Here are three stories from today:",
      `The FCA proposes minimum redemption terms for NURS funds (read it [here](${article("cp35").url})).`,
      `The PRISM Taskforce sets out what open finance needs to work (read it [here](${article("prism").url})).`,
      `The FCA maps three open finance infrastructure models (read it [here](${article("ofmaps").url})).`,
    ].join("\n\n");
    const expected = [
      ["The FCA proposes minimum redemption terms for NURS funds (read it here).", ["cp35"]],
      ["The PRISM Taskforce sets out what open finance needs to work (read it here).", ["prism"]],
      ["The FCA maps three open finance infrastructure models (read it here).", ["ofmaps"]],
    ];

    expect(cited(layoutAgentReply(text, { sources: [article("cp35"), article("prism"), article("ofmaps")] })).map(([segment, keys]) => [
      (segment as string).split("\n").at(-1), keys,
    ])).toEqual(expected);

    // With no tool results to title them, "here" is not a name.
    const untitled = layoutAgentReply(text);
    expect(cited(untitled).map(([segment, keys]) => [(segment as string).split("\n").at(-1), keys])).toEqual(expected);
    expect(untitled.segments.flatMap(({ citations }) => citations.map(({ title }) => title))).toEqual([
      "The FCA proposes minimum redemption terms for NURS funds",
      "The PRISM Taskforce sets out what open finance needs to work",
      "The FCA maps three open finance infrastructure models",
    ]);

    // One such link after a story stays with that story, not the intro.
    const single = `Here are two stories from today:\n\nCP26/35: the FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets.\n\nThe PRISM Taskforce sets out what open finance actually needs to work (read it [here](${article("prism").url})).`;
    expect(cited(layoutAgentReply(single, { sources: [article("cp35"), article("prism"), article("ofmaps")] }))).toEqual([
      ["Here are two stories from today:\n\nCP26/35: the FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets.", ["cp35"]],
      ["The PRISM Taskforce sets out what open finance actually needs to work (read it here).", ["prism"]],
    ]);
  });

  it("treats a link that differs from its source only by a trailing slash or tracking as that source", () => {
    const prism = { title: article("prism").title, url: "https://news.example/prism/x/" };
    const ofmaps = { title: article("ofmaps").title, url: "https://news.example/maps/y/" };

    [
      "Read [the PRISM piece](https://news.example/prism/x?utm_source=agent) — the FCA's PRISM Taskforce sets out what open finance actually needs to work.",
      "The FCA's PRISM Taskforce sets out what open finance actually needs to work. https://www.news.example/prism/x",
    ].forEach((text) => {
      const layout = layoutAgentReply(text, { sources: [prism, ofmaps] });
      expect(layout.segments.flatMap(({ citations }) => citations)).toEqual([prism]);
      expect(layout.trailing).toEqual([]);
    });
  });

  it("reads headlines in any script, so their numbers and acronyms alone name nothing", () => {
    [
      ["日銀、2026年に利上げへ", "Here's the latest. The Bank of Japan meets in 2026 to consider a hike."],
      ["Сбер запустил AI-ассистента для бизнеса", "AI is the big theme this week."],
      ["Ο προϋπολογισμός του 2026 ψηφίστηκε", "The 2026 budget passed."],
      ["ЦБ сохранил ставку 16%", "Inflation stood at 16% last month."],
      ["日銀、2026年に利上げへ", "トヨタは2026年に新しいEVを発売します。"],
      // Another bank's AI launch, in the same language.
      ["Сбер запустил AI-ассистента для бизнеса", "Главная новость: ВТБ запустил AI-сервис для клиентов."],
    ].forEach(([title, reply]) => {
      expect(layoutAgentReply(reply, { sources: [{ title, url: "https://news.example/a" }] }).segments.flatMap(({ citations }) => citations), title).toEqual([]);
    });

    // Named word for word, even mid-sentence, they are cited.
    [
      ["Сбер запустил AI-ассистента для бизнеса", "Главная новость: Сбер запустил AI-ассистента для бизнеса, сообщает компания."],
      ["Ο προϋπολογισμός του 2026 ψηφίστηκε από τη Βουλή", "Σήμερα ο προϋπολογισμός του 2026 ψηφίστηκε από τη Βουλή, όπως αναμενόταν."],
      ["日銀、2026年に利上げへ", "最新のニュース：日銀、2026年に利上げへ。"],
    ].forEach(([title, reply]) => {
      expect(layoutAgentReply(reply, { sources: [{ title, url: "https://news.example/a" }] }).segments.flatMap(({ citations }) => citations), title).toEqual([
        { title, url: "https://news.example/a" },
      ]);
    });
  });

  it("does not cite general knowledge that shares a headline's names and topic", () => {
    const sets = "The Bank of England sets interest rates eight times a year, through its Monetary Policy Committee.";
    const mortgages = "Mortgage rates have been rising even though the Bank of England is expected to cut later this year.";
    const shelves = [["boehold"], ["lenders", "boehold"], ["boehold", "pound", "oil", "ryanair", "ftse", "barratt"]];

    shelves.forEach((keys) => [sets, mortgages].forEach((text) => {
      expect(cited(layoutAgentReply(text, { sources: keys.map(headline) })), `${keys}: ${text}`).toEqual([]);
    }));

    // Saying what the story says still names it.
    expect(cited(layoutAgentReply("The Bank of England has held interest rates at 4%, with the MPC split six to three.", { sources: [headline("boehold")] }))).toEqual([
      ["The Bank of England has held interest rates at 4%, with the MPC split six to three.", ["boehold"]],
    ]);
  });

  it("prefers a story sentence to a closing question or offer that repeats its code", () => {
    const sources = ["cp35", "prism", "authq1", "cp34", "ofmaps"].map(article);

    expect(cited(layoutAgentReply(
      "The FCA wants minimum redemption terms for NURS funds that hold lots of illiquid assets.\n\nIt is also consulting on guidance and transitional rules for the new transaction reporting regime.\n\nWould you like more detail on CP26/35 or CP26/34?",
      { sources },
    ))).toEqual([
      ["The FCA wants minimum redemption terms for NURS funds that hold lots of illiquid assets.", ["cp35"]],
      ["It is also consulting on guidance and transitional rules for the new transaction reporting regime.", ["cp34"]],
    ]);
    expect(cited(layoutAgentReply(
      "The FCA proposes minimum redemption terms for NURS funds invested in illiquid assets. Let me know if you'd like the full text of CP26/35.",
      { sources },
    ))).toEqual([
      ["The FCA proposes minimum redemption terms for NURS funds invested in illiquid assets.", ["cp35"]],
    ]);

    // With no story sentence to name it, the question still can.
    expect(cited(layoutAgentReply("Would you like more detail on CP26/35?", { sources }))).toEqual([
      ["Would you like more detail on CP26/35?", ["cp35"]],
    ]);
  });

  it("lets the longest headline found word for word keep its words", () => {
    const short = { title: "FCA fines Barclays", url: "https://news.example/short" };
    const long = { title: "FCA fines Barclays £40m over Qatar deal", url: "https://news.example/long" };
    const holds = { title: "Bank of England holds rates", url: "https://news.example/holds" };
    const sticks = { title: "Bank of England holds rates at 4% as inflation sticks", url: "https://news.example/sticks" };

    [[short, long], [long, short]].forEach((sources) => {
      expect(layoutAgentReply("FCA fines Barclays £40m over Qatar deal.", { sources }).segments[0].citations).toEqual([long]);
    });
    expect(layoutAgentReply("Top story: Bank of England holds rates at 4% as inflation sticks.", { sources: [holds, sticks] }).segments[0].citations).toEqual([sticks]);

    // The shorter one is named where it stands on its own.
    expect(layoutAgentReply("FCA fines Barclays £40m over Qatar deal.\n\nSeparately, FCA fines Barclays again.", { sources: [short, long] }).segments).toEqual([
      { text: "FCA fines Barclays £40m over Qatar deal.", citations: [long] },
      { text: "\n\nSeparately, FCA fines Barclays again.", citations: [short] },
    ]);
  });

  it("names a headline of a word or two only on a line of its own or in quotes", () => {
    const markets = { title: "Markets", url: "https://news.example/markets" };
    const rates = { title: "Interest rates", url: "https://news.example/rates" };
    const podcast = { title: "Podcast", url: "https://news.example/podcast" };
    const sources = [markets, rates, podcast];

    [
      "Markets were calm after the Bank of England held rates.",
      "Interest rates are the big story this week, with the Bank of England expected to hold.",
      "You can hear more on this in our podcast.",
    ].forEach((text) => expect(cited(layoutAgentReply(text, { sources })), text).toEqual([]));

    expect(layoutAgentReply("Today's sections:\n\n1. Markets\n2. Interest rates\n\nListen to \"Podcast\" for more.", { sources }).segments.map(({ citations }) => citations)).toEqual([
      [markets], [rates], [podcast],
    ]);
  });

  it("does not end a sentence at a shortened month, title or reference before what it shortens", () => {
    [
      "The Upper Tribunal confirmed the Odey industry ban and cut the fine to £1.53m on Aug. 12, 2026.",
      "The Upper Tribunal confirmed the Odey industry ban on Sept. 30 and cut the fine to £1.53m.",
      "The Upper Tribunal confirmed the Odey industry ban, Prof. Smith notes, and cut the fine to £1.53m.",
      "The Upper Tribunal confirmed the Odey industry ban and cut the fine to £1.53m, approx. 30% less.",
      "The Upper Tribunal confirmed the Odey industry ban and cut the fine to £1.53m (see p. 4).",
      "The Upper Tribunal confirmed the Odey industry ban and cut the fine to £1.53m, per Fig. 2 of the ruling.",
    ].forEach((text) => {
      expect(layoutAgentReply(text, { sources: [article("odey"), article("miah")] }).segments, text).toEqual([
        { text, citations: [headline("odey")] },
      ]);
    });

    // A month that ends a sentence still ends it.
    expect(cited(layoutAgentReply(
      "The Upper Tribunal confirmed the Odey industry ban and cut the fine to £1.53m on 12 Aug. Nothing else has changed.",
      { sources: [article("odey")] },
    ))).toEqual([["The Upper Tribunal confirmed the Odey industry ban and cut the fine to £1.53m on 12 Aug.", ["odey"]]]);
  });

  it("names a question headline in a question that paraphrases it", () => {
    const westminster = { title: "Will Westminster learn the right lessons from Scotland's education disaster?", url: "https://news.example/westminster" };

    expect(cited(layoutAgentReply(
      "There's also an opinion piece: how do central bankers set rates when inflation is so unpredictable?",
      { sources: [article("centralbankers"), article("boehold")] },
    ))).toEqual([["There's also an opinion piece: how do central bankers set rates when inflation is so unpredictable?", ["centralbankers"]]]);
    expect(layoutAgentReply(
      "Finally, Christian May asks whether Westminster will learn the right lessons from Scotland's education disaster?",
      { sources: [westminster, article("boehold")] },
    ).segments[0].citations).toEqual([westminster]);

    // Any other headline is not named by a question about its topic.
    expect(cited(layoutAgentReply("More on Bank of England interest rates?", { sources: [article("boehold")] }))).toEqual([]);
  });

  it("cites a story named in words beside another story's code", () => {
    const sources = [article("cp34"), article("prism"), article("ofmaps")];

    [
      "Unlike CP26/34, the PRISM Taskforce paper looks at what open finance needs.",
      "While CP26/34 covers transaction reporting, the PRISM Taskforce looks at what open finance needs to work.",
    ].forEach((text) => expect(cited(layoutAgentReply(text, { sources })), text).toEqual([[text, ["cp34", "prism"]]]));
  });
});

// Markers become private-use characters so they pass through the same link
// clean-up as the reply, then come out as offsets in the displayed answer.
const MARKER = /\[\[([^\]]+)\]\]/g;
const MARK_BASE = 0xe100;

interface Expected {
  key: string;
  optional: boolean;
}

const expectationsOf = (reply: string) => {
  const marks: Expected[][] = [];
  const marked = reply.replace(MARKER, (_match, keys: string) => {
    marks.push(keys.split(",").map((key) => ({ key: key.trim().replace(/^~/, ""), optional: key.trim().startsWith("~") })));
    return String.fromCharCode(MARK_BASE + marks.length - 1);
  });

  const expected = new Map<number, Expected[]>();
  let display = "";
  for (const char of formatAgentAnswer(marked)) {
    const mark = char.charCodeAt(0) - MARK_BASE;
    if (mark >= 0 && mark < marks.length) {
      expected.set(display.length, marks[mark]);
    } else {
      display += char;
    }
  }

  return { text: reply.replace(MARKER, ""), display, expected };
};

const placementsOf = (layout: AgentReplyLayout) => {
  const placed = new Map<number, string[]>();
  let offset = 0;
  layout.segments.forEach(({ text, citations }) => {
    offset += text.length;
    if (citations.length > 0) { placed.set(offset, citations.map(({ url }) => keyOf.get(url) || url)); }
  });
  return placed;
};

const evaluate = (corpusCase: CorpusCase) => {
  const { text, display, expected } = expectationsOf(corpusCase.reply);
  // Sources arrive as the client keeps them: headline only.
  const layout = layoutAgentReply(text, {
    sources: corpusCase.sources.map(headline),
    explicit: (corpusCase.explicit || []).map(article),
    fallback: corpusCase.fallback ? article(corpusCase.fallback) : null,
  });
  const placed = placementsOf(layout);

  const truePositives: string[] = [];
  const falsePositives: string[] = [];
  const misses: string[] = [];
  const optionalMisses: string[] = [];
  const misordered: string[] = [];

  placed.forEach((keys, offset) => {
    const wanted = expected.get(offset) || [];
    keys.forEach((key) => {
      const label = `${key}@${JSON.stringify(display.slice(Math.max(0, offset - 30), offset))}`;
      (wanted.some((entry) => entry.key === key) ? truePositives : falsePositives).push(label);
    });

    const order = wanted.map(({ key }) => key).filter((key) => keys.includes(key));
    if (order.join() !== keys.filter((key) => order.includes(key)).join()) { misordered.push(keys.join()); }
  });
  expected.forEach((wanted, offset) => {
    wanted.forEach(({ key, optional }) => {
      if ((placed.get(offset) || []).includes(key)) { return; }
      (optional ? optionalMisses : misses).push(`${key}@${JSON.stringify(display.slice(Math.max(0, offset - 30), offset))}`);
    });
  });

  const trailing = layout.trailing.map(({ url }) => keyOf.get(url) || url);
  const expectedTrailing = corpusCase.trailing
    || (corpusCase.fallback && placed.size === 0 ? [corpusCase.fallback] : []);

  return { layout, text, display, truePositives, falsePositives, misses, optionalMisses, misordered, trailing, expectedTrailing };
};

describe("layoutAgentReply evaluation corpus", () => {
  it("has at least 40 replies", () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(40);
  });

  CORPUS.forEach((corpusCase) => {
    it(corpusCase.name, () => {
      const result = evaluate(corpusCase);

      expect(result.display).toEqual(formatAgentAnswer(result.text));
      expect(joined(result.layout)).toEqual(result.display);
      expect({
        falsePositives: result.falsePositives,
        misses: result.misses,
        misordered: result.misordered,
        trailing: result.trailing,
      }).toEqual({
        falsePositives: [],
        misses: [],
        misordered: [],
        trailing: result.expectedTrailing,
      });
    });
  });

  it("never places a wrong citation and finds nearly all the right ones", () => {
    const totals = { truePositives: 0, falsePositives: 0, misses: 0, optionalMisses: 0 };
    const optionalMissed: string[] = [];

    CORPUS.forEach((corpusCase) => {
      const result = evaluate(corpusCase);
      totals.truePositives += result.truePositives.length;
      totals.falsePositives += result.falsePositives.length;
      totals.misses += result.misses.length;
      totals.optionalMisses += result.optionalMisses.length;
      optionalMissed.push(...result.optionalMisses.map((miss) => `${corpusCase.name}: ${miss}`));
    });

    const precision = totals.truePositives / (totals.truePositives + totals.falsePositives);
    const recall = totals.truePositives / (totals.truePositives + totals.misses + totals.optionalMisses);
    if (process.env.CITATION_METRICS) {
      console.log({ cases: CORPUS.length, ...totals, precision, recall, optionalMissed });
    }

    expect(precision).toEqual(1);
    expect(recall).toBeGreaterThanOrEqual(0.95);
  });
});
