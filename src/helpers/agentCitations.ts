import type { AgentCitation, AgentReplyLayout, AgentReplySegment } from "./agentContracts";
import { agentCitationKey, agentCitationsFromText, agentTextWithoutLinks, markAgentLinkLabels, mergeAgentCitations } from "./agentLinks";

interface AgentReplyLayoutOptions {
  // Articles the agent's tools returned this session, newest first. Each is
  // cited only beside a sentence that names it.
  sources?: AgentCitation[];
  // Always shown: beside the sentence that names them, otherwise trailing.
  explicit?: AgentCitation[];
  // Shown trailing when the reply cites nothing else, e.g. the one article a
  // turn's tools returned, summarised without naming it.
  fallback?: AgentCitation | null;
}

// A word as the matcher sees it. seq is the exact form, for finding a
// headline word for word; word is the stemmed content form (null for
// stopwords, numbers and codes); code is a document code such as CP26/35.
interface Token {
  seq: string;
  word: string | null;
  code: string | null;
  start: number;
  end: number;
}

interface Piece {
  text: string;
  from: number;
  to: number;
  number?: boolean;
  strong?: boolean;
}

interface Span {
  start: number;
  end: number;
}

interface Sentence {
  start: number;
  end: number;
  // The indexes of its first and last tokens.
  first: number;
  last: number;
  words: Map<string, number>;
  codes: Map<string, number>;
  // A bridge, offer or question to the reader: it can only name a story
  // outright.
  meta: boolean;
  // Any other question names only a story whose headline asks it.
  question: boolean;
}

interface Name {
  seq: string[];
  // Two content words or fewer and no code ("Markets", "Interest rates"):
  // ordinary prose says as much, so only a line or a quote of its own names it.
  loose: boolean;
}

interface Candidate {
  citation: AgentCitation;
  always: boolean;
  names: Name[];
  words: Set<string>;
  codes: Set<string>;
  // Its headline is a loose name, so only the name itself counts.
  loose: boolean;
  question: boolean;
  // Where a link the agent wrote has its label in the displayed answer.
  written: Span | null;
}

interface Placement {
  sentence: number;
  score: number;
  position: number;
  codeHit: boolean;
  exact: boolean;
  // In a bridge, offer or question: used only when no story sentence names it.
  aside: boolean;
  matched: string[];
}

// Thresholds tuned against the corpus in test/fixtures/agentCitationsCorpus.ts.
// A wrong link is worse than a missing one, so each errs towards precision.
const MIN_COVERAGE = 0.6;
const MIN_MATCHED = 3;
const BROAD_COVERAGE = 0.5;
const BROAD_MATCHED = 4;
const SHORT_HEADLINE_WORDS = 4;
const SHORT_HEADLINE_COVERAGE = 0.75;
const FOREIGN_CODE_COVERAGE = 0.8;
const DISTINCT_MATCHED = 2;
const DISTINCT_COVERAGE = 0.25;
const EXACT_SCORE = 3;
const ECHO_COVERAGE = 0.85;
const SENTENCE_SHARE = 0.5;
const LOOSE_NAME_WORDS = 2;
const MAX_WRITTEN_LINKS = 50;

// Built at runtime: an engine without Unicode property escapes would refuse
// the whole bundle over a literal. There the ASCII pattern stands in.
const unicodePattern = (source: string, flags: string, ascii: RegExp): RegExp => {
  try {
    return new RegExp(source, flags);
  } catch {
    return ascii;
  }
};

// Letters and digits of any script, so a headline in Greek or Japanese is
// read as words rather than as whatever ASCII it happens to contain.
const TOKEN_PATTERN = unicodePattern(
  "[\\p{L}\\p{N}][\\p{L}\\p{M}\\p{N}]*(?:[/.\\-'][\\p{L}\\p{N}][\\p{L}\\p{M}\\p{N}]*)*",
  "gu",
  /[a-z0-9]+(?:[/.\-'][a-z0-9]+)*/g,
);
// Scripts written without spaces, where one token can be a whole phrase.
const UNSPACED = unicodePattern(
  "[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Thai}\\p{Script=Lao}\\p{Script=Khmer}\\p{Script=Myanmar}]",
  "u",
  /[\u3040-\u30ff\u3400-\u9fff\u0e00-\u0eff]/,
);
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const QUOTE_MARKS = /[‘’‛′`´ʼ]/g;
const HYPHENS = /[‐‑‒]/g;
const FIGURE = /^\d+(?:\.\d+)?(?:bn|m|k|pc|p|ppt|x|st|nd|rd|th|s|tn|trn|bps|bp|mw|gw|kw|gb|tb|mph|kg|km)$/;
const STRONG_CODE = /^[a-z]+\d+[/-]\d+$/;
const NUMBER = /^\d+(?:\.\d+)*$/;
const NUMBER_PAIR = /^\d+[/-]\d+$/;
const META_SENTENCE = /^(?:(?:and|so|okay|sure|now|great)[,\s]+)?(?:let me|let's|i'll|i will|i'm going to|i am going to|i can|shall i|want me to|would you like|do you want)\b/i;
const ASKS_THE_READER = /\b(?:you|your|yours|shall i|should i|want me|anything else)\b/i;
const QUESTION = /\?["'”’)\]]*$/;
const SENTENCE_END = unicodePattern(
  "[.!?…]+[\"'”’)\\]]*(?=[^\\S\\n]+(?:[\\p{Lu}\\p{Lt}\\p{Lo}\\d]|[\"'“‘«([]))",
  "gu",
  /[.!?…]+["'”’)\]]*(?=[^\S\n]+(?:[A-Z0-9À-ÖØ-Þ]|["'“‘«([]))/g,
);
const OPENING_QUOTE = /["“‘'«*_]$/;
const CLOSING_QUOTE = /^[.,!?…]?["”’'»*_]/;

// Private-use marks around a written link's label, distinct from the one
// agentTextWithoutLinks uses for bare URLs.
const LABEL_OPEN = "\uE001";
const LABEL_CLOSE = "\uE002";

const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "st", "vs", "etc", "e.g", "i.e", "inc", "ltd", "co", "corp", "u.s", "u.k", "a.m", "p.m",
  "prof", "gov", "sen", "rep", "gen", "col", "lt", "sgt", "jr", "sr", "rev", "hon", "dept", "approx", "fig", "figs",
  "vol", "p", "pp",
]);

// Shortened only before a number ("Aug. 12", "No. 10", "est. 30%"); before
// anything else the full stop still ends the sentence ("on 12 Aug. Then ...").
const NUMBERED_ABBREVIATIONS = new Set([
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec", "no", "est",
]);

const MONTHS = new Set([
  "jan", "feb", "mar", "apr", "may", "jun", "june", "jul", "july", "aug", "sep", "sept", "oct", "nov", "dec",
]);

const STOPWORDS = new Set([
  "a", "an", "the",
  "about", "above", "across", "after", "against", "ahead", "along", "amid", "amidst", "among", "around", "as", "at",
  "before", "behind", "below", "beside", "between", "beyond", "by", "despite", "down", "during", "except", "for",
  "from", "in", "inside", "into", "like", "near", "of", "off", "on", "onto", "out", "over", "past", "per", "since",
  "than", "through", "till", "to", "toward", "towards", "under", "until", "up", "upon", "via", "with", "within",
  "without",
  "and", "but", "or", "nor", "so", "yet", "if", "because", "while", "whilst", "although", "though", "whether",
  "either", "neither", "both", "also", "then", "that", "which", "who", "whom", "whose", "what", "when", "where",
  "why", "how",
  "i", "me", "my", "we", "us", "our", "you", "your", "he", "him", "his", "she", "her", "it", "its", "they", "them",
  "their", "this", "these", "those", "there", "here", "someone", "anyone", "something", "anything", "nothing",
  "each", "every", "all", "any", "some", "such", "other", "another", "own", "same",
  "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did",
  "doing", "will", "would", "shall", "should", "can", "could", "may", "might", "must", "i'll", "i'm", "i've", "i'd",
  "you'd", "you're", "you'll", "we're", "we'll", "we've", "they're", "they've", "don't", "doesn't", "didn't", "isn't",
  "aren't", "wasn't", "weren't", "won't", "wouldn't", "can't", "couldn't", "shouldn't", "hasn't", "haven't",
  "not", "no", "yes", "very", "too", "just", "only", "more", "most", "much", "many", "few", "less", "so", "again",
  "still", "even", "ever", "never", "now", "new", "says", "said", "say", "according", "really", "actually", "quite",
  "rather", "well", "get", "gets", "got", "percent", "cent", "mr", "mrs", "ms",
  "story", "stories", "article", "articles", "headline", "headlines", "latest", "piece", "pieces", "today",
  "first", "second", "third", "fourth", "fifth", "next", "last", "finally", "lastly", "meanwhile", "elsewhere",
  "plus", "however", "okay", "sure", "year", "years",
]);

// Past tenses a paraphrase uses for a headline's present tense.
const IRREGULAR_VERBS = new Map([
  ["held", "hold"], ["rose", "rise"], ["risen", "rise"], ["fell", "fall"], ["fallen", "fall"], ["sold", "sell"],
  ["won", "win"], ["lost", "lose"], ["paid", "pay"], ["made", "make"], ["took", "take"], ["taken", "take"],
  ["gave", "give"], ["given", "give"], ["grew", "grow"], ["grown", "grow"], ["began", "begin"], ["begun", "begin"],
  ["led", "lead"], ["met", "meet"], ["bought", "buy"], ["brought", "bring"], ["found", "find"], ["kept", "keep"],
  ["left", "leave"], ["spent", "spend"], ["struck", "strike"], ["sought", "seek"], ["wrote", "write"],
  ["written", "write"], ["chose", "choose"], ["chosen", "choose"], ["slid", "slide"], ["sank", "sink"],
  ["sunk", "sink"], ["swung", "swing"], ["drove", "drive"], ["driven", "drive"], ["ran", "run"],
]);

const NUMBER_WORDS = new Map([
  ["zero", 0], ["one", 1], ["two", 2], ["three", 3], ["four", 4], ["five", 5], ["six", 6], ["seven", 7],
  ["eight", 8], ["nine", 9], ["ten", 10], ["eleven", 11], ["twelve", 12], ["thirteen", 13], ["fourteen", 14],
  ["fifteen", 15], ["sixteen", 16], ["seventeen", 17], ["eighteen", 18], ["nineteen", 19], ["twenty", 20],
  ["thirty", 30], ["forty", 40], ["fifty", 50], ["sixty", 60], ["seventy", 70], ["eighty", 80], ["ninety", 90],
]);

const isNumberWord = (text: string): boolean => NUMBER_WORDS.has(text) || text === "hundred" || text === "thousand";

// The answer as displayed: bare URLs move to citations, and runs of empty
// lines cap at one paragraph break.
const formatAgentAnswer = (text: string): string => agentTextWithoutLinks(text)
  .replace(/\n(?:[ \t]*\n){2,}/g, "\n\n");

// The headline is a title's first line; the rest are the article's own
// subheadings, which the agent is told not to name.
const headlineOf = (title: string): string => (
  title.split("\n").map((line) => line.trim()).find(Boolean) || title.trim()
);

// Lowercase, strip accents and straighten quotes one character at a time,
// keeping each folded character's offset in the original text.
const fold = (text: string): { folded: string; starts: number[]; ends: number[] } => {
  let folded = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;

  for (const char of text) {
    let piece = char === "&" ? " and " : char.toLowerCase();
    if (char > "\u007f") {
      piece = piece.normalize("NFKD").replace(COMBINING_MARKS, "").replace(QUOTE_MARKS, "'").replace(HYPHENS, "-");
    }

    for (let k = 0; k < piece.length; k++) {
      starts.push(index);
      ends.push(index + char.length);
    }
    folded += piece;
    index += char.length;
  }

  return { folded, starts, ends };
};

const undouble = (stem: string): string => (/([bdgmnprt])\1$/.test(stem) ? stem.slice(0, -1) : stem);

// Just enough stemming that "proposes", "proposed" and "proposing" all meet
// at "propos"; it only has to agree with itself.
const stem = (word: string): string => {
  let stemmed = word;
  if (stemmed.length > 3) {
    if (/ie[sd]$/.test(stemmed) && stemmed.length > 4) {
      stemmed = `${stemmed.slice(0, -3)}y`;
    } else if (/(?:s|x|z|ch|sh)es$/.test(stemmed)) {
      stemmed = stemmed.slice(0, -2);
    } else if (stemmed.endsWith("ing") && stemmed.length >= 6) {
      stemmed = undouble(stemmed.slice(0, -3));
    } else if (stemmed.endsWith("ed") && stemmed.length >= 5 && !(stemmed.endsWith("eed") && stemmed.length < 7)) {
      stemmed = undouble(stemmed.slice(0, -2));
    } else if (stemmed.endsWith("s") && !/(?:ss|us|is)$/.test(stemmed)) {
      stemmed = stemmed.slice(0, -1);
    }
    if (stemmed.length > 3 && stemmed.endsWith("e")) { stemmed = stemmed.slice(0, -1); }
  }

  return stemmed.replace(/iz/g, "is").replace(/yz/g, "ys");
};

// Spoken figures: "twenty-six" -> 26, "twenty twenty-six" -> 2026.
const numbersFromWords = (run: Piece[]): Piece[] => {
  const numbers: Piece[] = [];
  let total = 0;
  let current = -1;
  let from = -1;
  let to = -1;

  const flush = () => {
    if (from >= 0) { numbers.push({ text: String(total + Math.max(current, 0)), from, to, number: true }); }
    total = 0;
    current = -1;
    from = -1;
  };

  run.forEach((piece) => {
    if (piece.text === "and") { return; }

    if (piece.text === "hundred") {
      current = Math.max(current, 1) * 100;
    } else if (piece.text === "thousand") {
      total += Math.max(current, 1) * 1000;
      current = -1;
    } else {
      const value = NUMBER_WORDS.get(piece.text);
      const afterHundreds = current > 0 && current % 100 === 0;
      const afterTens = current % 100 >= 20 && current % 10 === 0 && value < 10;
      if (current < 0 && from >= 0) {
        current = value;
      } else if (afterHundreds || afterTens) {
        current += value;
      } else {
        flush();
        current = value;
      }
    }

    if (from < 0) { from = piece.from; }
    to = piece.to;
  });
  flush();

  // "twenty twenty-six" is a year, read as two numbers.
  for (let i = numbers.length - 2; i >= 0; i--) {
    const [century, year] = [Number(numbers[i].text), Number(numbers[i + 1].text)];
    if ((century === 19 || century === 20) && year < 100) {
      numbers.splice(i, 2, { text: String(century * 100 + year), from: numbers[i].from, to: numbers[i + 1].to, number: true });
    }
  }

  return numbers;
};

const tokenize = (text: string): Token[] => {
  const { folded, starts, ends } = fold(text);
  const touching = (a: Piece, b: Piece, gap = /^[^\S\n]*$/): boolean => gap.test(folded.slice(a.to, b.from));

  // Possessives go, and hyphenated or slashed words split into their parts
  // unless they carry a digit (CP26/35, 2026/27).
  const pieces: Piece[] = [];
  for (const match of folded.matchAll(TOKEN_PATTERN)) {
    const raw = match[0].replace(/'s$/, "");
    if (/\d/.test(raw) || !/[/-]/.test(raw)) {
      pieces.push({ text: raw, from: match.index, to: match.index + raw.length });
      continue;
    }
    for (const part of raw.matchAll(/[^/-]+/g)) {
      pieces.push({ text: part[0], from: match.index + part.index, to: match.index + part.index + part[0].length });
    }
  }

  const spoken: Piece[] = [];
  for (let i = 0; i < pieces.length; i++) {
    if (!isNumberWord(pieces[i].text)) {
      spoken.push(pieces[i]);
      continue;
    }

    const run = [pieces[i]];
    while (i + 1 < pieces.length && touching(pieces[i], pieces[i + 1], /^[^\S\n]*-?[^\S\n]*$/)) {
      const next = pieces[i + 1];
      const joinsAnd = next.text === "and" && /^(?:hundred|thousand)$/.test(pieces[i].text)
        && i + 2 < pieces.length && isNumberWord(pieces[i + 2].text);
      if (!isNumberWord(next.text) && !joinsAnd) { break; }
      run.push(next);
      i++;
    }
    spoken.push(...numbersFromWords(run));
  }

  // "twenty-six slash thirty-five" -> 26/35.
  const paired: Piece[] = [];
  for (let i = 0; i < spoken.length; i++) {
    const [first, slash, second] = [spoken[i], spoken[i + 1], spoken[i + 2]];
    if (first.number && slash?.text === "slash" && second?.number && touching(first, slash) && touching(slash, second)) {
      paired.push({ text: `${first.text}/${second.text}`, from: first.from, to: second.to });
      i += 2;
      continue;
    }
    paired.push(first);
  }

  // A short capitalised prefix joins the number after it: "CP 26/35" and
  // "CP twenty-six thirty-five" both read as cp2635, "Q 1" as q1.
  const joined: Piece[] = [];
  for (let i = 0; i < paired.length; i++) {
    const piece = paired[i];
    const next = paired[i + 1];
    const prefix = /^[a-z]{1,4}$/.test(piece.text) && !STOPWORDS.has(piece.text) && !MONTHS.has(piece.text)
      && /^[A-Z]+$/.test(text.slice(starts[piece.from], ends[piece.to - 1]));
    const numeric = next && touching(piece, next) && (NUMBER_PAIR.test(next.text) || /^\d{1,3}$/.test(next.text));
    if (!prefix || !numeric) {
      joined.push(piece);
      continue;
    }

    const after = paired[i + 2];
    if (/^\d{1,3}$/.test(next.text) && after && /^\d{1,3}$/.test(after.text) && touching(next, after)) {
      joined.push({ text: `${piece.text}${next.text}/${after.text}`, from: piece.from, to: after.to, strong: true });
      i += 2;
      continue;
    }
    joined.push({ text: `${piece.text}${next.text}`, from: piece.from, to: next.to, strong: NUMBER_PAIR.test(next.text) });
    i++;
  }

  return joined.map((piece) => {
    const { text: raw } = piece;
    const token = { seq: raw, word: null, code: null, start: starts[piece.from], end: ends[piece.to - 1] };

    if (piece.strong || STRONG_CODE.test(raw)) {
      token.seq = raw.replace(/[/.-]/g, "");
      token.code = token.seq;
    } else if (NUMBER.test(raw)) {
      token.seq = raw;
    } else if (/\d/.test(raw) && !FIGURE.test(raw)) {
      // Weaker codes such as Q1, FTSE 100 or 2026/27 count as ordinary words.
      token.seq = raw.replace(/[/.\-']/g, "");
      token.word = token.seq;
    } else if (/\d/.test(raw)) {
      token.word = raw;
    } else if (!STOPWORDS.has(raw)) {
      token.word = stem(IRREGULAR_VERBS.get(raw) || raw);
    }

    return token;
  });
};

// Sentences of the displayed answer as [start, end) ranges of non-blank
// text. Line breaks always end one; within a line, a sentence ends at
// terminal punctuation followed by a capital, digit or opening quote.
const sentenceRanges = (display: string): Array<[number, number]> => {
  const ranges: Array<[number, number]> = [];
  let lineStart = 0;

  display.split("\n").forEach((line) => {
    const firstChar = line.search(/\S/);
    if (firstChar >= 0) {
      const lastChar = line.length - line.match(/\s*$/)[0].length;
      let start = firstChar;

      for (const match of line.matchAll(SENTENCE_END)) {
        const end = match.index + match[0].length;
        const before = line.slice(start, match.index);

        if (match[0].startsWith(".") && !match[0].startsWith("..")) {
          const word = before.match(/([A-Za-z][A-Za-z.]*)$/)?.[1] || "";
          const lower = word.toLowerCase();
          if (ABBREVIATIONS.has(lower) || /^[A-Z]$/.test(word)) { continue; }
          if (NUMBERED_ABBREVIATIONS.has(lower) && /^\s+\d/.test(line.slice(end))) { continue; }
          // "1. Headline" numbers a list item, not a sentence.
          if (/^\d+$/.test(before) && start === firstChar) { continue; }
        }

        ranges.push([lineStart + start, lineStart + end]);
        start = end + line.slice(end).search(/\S/);
      }

      ranges.push([lineStart + start, lineStart + lastChar]);
    }
    lineStart += line.length + 1;
  });

  return ranges;
};

const sentenceAt = (sentences: Sentence[], offset: number): number => (
  sentences.findIndex(({ start, end }) => offset >= start && offset < end)
);

// Every place the needle's tokens appear in a row.
const indexesOfSequence = (haystack: string[], needle: string[]): number[] => {
  const indexes: number[] = [];
  if (needle.length === 0) { return indexes; }

  for (let i = 0; i + needle.length <= haystack.length; i++) {
    let j = 0;
    while (j < needle.length && haystack[i + j] === needle[j]) { j++; }
    if (j === needle.length) { indexes.push(i); }
  }
  return indexes;
};

const nameOf = (tokens: Token[]): Name | null => {
  const content = tokens.filter(({ word, code }) => word || code);
  // Numbers and stopwords alone ("2026", "here") name nothing.
  if (content.length === 0) { return null; }

  return {
    seq: tokens.map(({ seq }) => seq),
    loose: content.length <= LOOSE_NAME_WORDS && !content.some(({ code, seq }) => code || UNSPACED.test(seq)),
  };
};

// Where each Markdown link's label sits in the displayed answer, by URL. The
// reply is cleaned up again with one label marked at a time; a mark the
// clean-up moves or drops gives that link no place.
const writtenSpans = (text: string, display: string): Map<string, Span> => {
  const urls: string[] = [];
  markAgentLinkLabels(text, (url) => { urls.push(url); return null; });

  const spans = new Map<string, Span>();
  urls.slice(0, MAX_WRITTEN_LINKS).forEach((url, index) => {
    const key = agentCitationKey(url);
    if (spans.has(key)) { return; }

    const marked = formatAgentAnswer(markAgentLinkLabels(text, (_url, at) => (at === index ? [LABEL_OPEN, LABEL_CLOSE] : null)));
    let start = marked.indexOf(LABEL_OPEN);
    let end = marked.indexOf(LABEL_CLOSE) - LABEL_OPEN.length;
    if (start < 0 || end < start || marked.replace(LABEL_OPEN, "").replace(LABEL_CLOSE, "") !== display) { return; }

    while (start < end && /\s/.test(display[start])) { start++; }
    while (end > start && /\s/.test(display[end - 1])) { end--; }
    if (end > start) { spans.set(key, { start, end }); }
  });

  return spans;
};

const buildCandidates = (text: string, display: string, sources: AgentCitation[], explicit: AgentCitation[]): Candidate[] => {
  const given = mergeAgentCitations(explicit);
  const written = mergeAgentCitations(agentCitationsFromText(text));
  const known = mergeAgentCitations(sources);
  const byUrl = new Map(known.map((source) => [agentCitationKey(source.url), source]));
  const spans = written.length > 0 ? writtenSpans(text, display) : new Map<string, Span>();
  const candidates: Candidate[] = [];
  const seenUrls = new Set<string>();
  const seenNames = new Set<string>();

  const add = (citation: AgentCitation, always: boolean, place: Span | null = null, alias?: string) => {
    const url = agentCitationKey(citation.url);
    const headline = headlineOf(citation.title);
    const tokens = tokenize(headline);
    const key = tokens.map(({ seq }) => seq).join(" ");
    if (seenUrls.has(url) || (!always && seenNames.has(key))) { return; }
    seenUrls.add(url);
    seenNames.add(key);

    const name = nameOf(tokens);
    candidates.push({
      citation: { title: headline, url: citation.url },
      always,
      names: [name, alias ? nameOf(tokenize(headlineOf(alias))) : null].filter((each): each is Name => each !== null),
      words: new Set(tokens.map(({ word }) => word).filter(Boolean)),
      codes: new Set(tokens.map(({ code }) => code).filter(Boolean)),
      loose: !name || name.loose,
      question: QUESTION.test(headline),
      written: place,
    });
  };

  given.forEach((citation) => add(citation, true));
  // A link the agent wrote sits where the agent put it, titled from its
  // source when a tool returned it. If its place is lost, its label still
  // finds it word for word - unless the label names nothing ("here").
  written.forEach((citation) => {
    const key = agentCitationKey(citation.url);
    const source = byUrl.get(key);
    add(source || citation, true, spans.get(key) || null, source ? citation.title : undefined);
  });
  known.forEach((citation) => add(citation, false));

  return candidates;
};

const placeCandidates = (display: string, ranges: Array<[number, number]>, candidates: Candidate[]): Map<Candidate, Placement> => {
  const tokens = tokenize(display);
  const sentences: Sentence[] = ranges.map(([start, end]) => {
    const text = display.slice(start, end);
    const question = QUESTION.test(text);
    const meta = META_SENTENCE.test(text) || (question && ASKS_THE_READER.test(text));
    return { start, end, first: -1, last: -1, words: new Map(), codes: new Map(), meta, question };
  });
  tokens.forEach((token, index) => {
    const sentence = sentences[sentenceAt(sentences, token.start)];
    if (!sentence) { return; }
    if (sentence.first < 0) { sentence.first = index; }
    sentence.last = index;
    if (token.word && !sentence.words.has(token.word)) { sentence.words.set(token.word, token.start); }
    if (token.code && !sentence.codes.has(token.code)) { sentence.codes.set(token.code, token.start); }
  });

  // Rarer words weigh more: ln(1 + N / df) over the candidates' headlines.
  const documentFrequency = new Map<string, number>();
  const codeOwners = new Map<string, Candidate[]>();
  candidates.forEach((candidate) => {
    candidate.words.forEach((word) => documentFrequency.set(word, (documentFrequency.get(word) || 0) + 1));
    candidate.codes.forEach((code) => codeOwners.set(code, [...(codeOwners.get(code) || []), candidate]));
  });
  const weight = (word: string) => Math.log(1 + candidates.length / (documentFrequency.get(word) || 1));
  const weightOf = (words: Iterable<string>) => Array.from(words).reduce((sum, word) => sum + weight(word), 0);

  // A bridge, offer or question can name a story outright, but a story
  // sentence that names it too is the better place.
  const aside = (sentence: Sentence, candidate: Candidate) => sentence.meta || (sentence.question && !candidate.question);

  // A loose name counts only as a sentence of its own (a list number aside)
  // or in quotes.
  const standsAlone = (from: number, to: number): boolean => {
    const sentence = sentences[sentenceAt(sentences, tokens[from].start)];
    if (!sentence) { return false; }

    const first = sentence.first < from && NUMBER.test(tokens[sentence.first].seq) ? sentence.first + 1 : sentence.first;
    if (first === from && sentence.last === to - 1) { return true; }

    const { start } = tokens[from];
    const { end } = tokens[to - 1];
    return OPENING_QUOTE.test(display.slice(Math.max(0, start - 1), start)) && CLOSING_QUOTE.test(display.slice(end, end + 2));
  };

  // Where each candidate is named word for word, as token ranges: a link the
  // agent wrote by its label, anything else by its names.
  const sequence = tokens.map(({ seq }) => seq);
  const exactSpans = new Map<Candidate, Array<[number, number]>>(candidates.map((candidate) => {
    if (candidate.written) {
      const { start, end } = candidate.written;
      const inside = tokens.flatMap((token, index) => (token.start >= start && token.end <= end ? [index] : []));
      return [candidate, inside.length > 0 ? [[inside[0], inside[inside.length - 1] + 1]] : []];
    }

    const spans = candidate.names.flatMap((name) => indexesOfSequence(sequence, name.seq)
      .map((at): [number, number] => [at, at + name.seq.length])
      .filter(([from, to]) => !name.loose || standsAlone(from, to)));
    return [candidate, spans.sort((a, b) => a[0] - b[0])];
  }));

  // The longest headline found word for word keeps those words: a shorter
  // one inside it ("FCA fines Barclays" in "FCA fines Barclays £40m over
  // Qatar deal") is not named there.
  const insideLonger = (candidate: Candidate, [from, to]: [number, number]) => candidates.some((other) => (
    other !== candidate && (exactSpans.get(other) || []).some(([start, end]) => start <= from && to <= end && end - start > to - from)
  ));

  const matches = new Map<Candidate, Placement[]>();

  candidates.forEach((candidate) => {
    // A link the agent wrote sits beside the sentence it was written in.
    const place = candidate.written ? sentenceAt(sentences, candidate.written.end - 1) : -1;
    if (place >= 0) {
      matches.set(candidate, [{ sentence: place, score: EXACT_SCORE, position: candidate.written.start, codeHit: false, exact: true, aside: false, matched: [] }]);
      return;
    }

    const found: Placement[] = [];
    const exact = (exactSpans.get(candidate) || []).find((span) => !insideLonger(candidate, span));
    const exactSentence = exact ? sentenceAt(sentences, tokens[exact[1] - 1].start) : -1;
    if (exactSentence >= 0) {
      found.push({
        sentence: exactSentence,
        score: EXACT_SCORE,
        position: tokens[exact[0]].start,
        codeHit: false,
        exact: true,
        aside: aside(sentences[exactSentence], candidate),
        matched: [],
      });
    }

    const total = weightOf(candidate.words);
    // Words another headline has too ("Bank of England interest rates")
    // cannot say which of the two stories a sentence means.
    const ambiguous = (matched: string[]) => candidates.some((other) => (
      other !== candidate && matched.every((word) => other.words.has(word))
    ));
    sentences.forEach((sentence, index) => {
      const matched = Array.from(candidate.words).filter((word) => sentence.words.has(word));
      const coverage = total > 0 ? weightOf(matched) / total : 0;
      const ownCodes = Array.from(candidate.codes).filter((code) => sentence.codes.has(code));
      const codeHit = ownCodes.some((code) => codeOwners.get(code).length === 1);
      const isAside = aside(sentence, candidate);

      // Another story's code says this sentence is about that story, unless
      // it also names this one in words that story's headline lacks.
      if (ownCodes.length === 0 && coverage < FOREIGN_CODE_COVERAGE) {
        const owners = Array.from(sentence.codes.keys()).flatMap((code) => codeOwners.get(code) || []);
        const distinct = matched.filter((word) => owners.every((owner) => !owner.words.has(word)));
        if (owners.length > 0 && (distinct.length < MIN_MATCHED || weightOf(distinct) / total < MIN_COVERAGE)) { return; }
      }

      const enoughWords = !candidate.loose && !isAside && (
        (coverage >= MIN_COVERAGE && matched.length >= MIN_MATCHED)
        || (coverage >= BROAD_COVERAGE && matched.length >= BROAD_MATCHED)
        || (coverage >= SHORT_HEADLINE_COVERAGE && matched.length >= 2 && candidate.words.size <= SHORT_HEADLINE_WORDS)
      );
      if (!codeHit && (!enoughWords || ambiguous(matched))) { return; }

      const position = codeHit
        ? Math.min(...ownCodes.map((code) => sentence.codes.get(code)))
        : Math.min(...matched.map((word) => sentence.words.get(word)));
      found.push({ sentence: index, score: codeHit ? 1 + coverage : coverage, position, codeHit, exact: false, aside: isAside, matched });
    });

    if (found.length > 0) { matches.set(candidate, found); }
  });

  // Near-duplicate stories share words: a looser match survives only on
  // words that a better match in the same sentence does not explain.
  const explained = (candidate: Candidate, placement: Placement): boolean => {
    if (placement.exact || placement.codeHit) { return false; }

    const rivals = candidates.filter((rival) => rival !== candidate && (matches.get(rival) || []).some((other) => (
      other.sentence === placement.sentence && other.score > placement.score
    )));
    if (rivals.length === 0) { return false; }

    const distinct = placement.matched.filter((word) => rivals.every((rival) => !rival.words.has(word)));
    return distinct.length < DISTINCT_MATCHED || weightOf(distinct) / weightOf(candidate.words) < DISTINCT_COVERAGE;
  };

  const pick = (keep: (candidate: Candidate, placement: Placement) => boolean): Map<Candidate, Placement> => {
    const picked = new Map<Candidate, Placement>();
    matches.forEach((found, candidate) => {
      const best = found
        .filter((placement) => !explained(candidate, placement) && keep(candidate, placement))
        .sort((a, b) => Number(a.aside) - Number(b.aside) || b.score - a.score || a.sentence - b.sentence)[0];
      if (best) { picked.set(candidate, best); }
    });
    return picked;
  };

  // A sentence that echoes only part of a headline must be mostly about the
  // stories cited beside it. "The Bank of England sets interest rates eight
  // times a year" shares four of five words with "Bank of England holds
  // interest rates at 4%", and on a small shelf nothing says those four are
  // common, but most of what it says is not that story.
  const first = pick(() => true);
  const citedWords = new Map<number, Set<string>>();
  first.forEach(({ sentence }, candidate) => {
    citedWords.set(sentence, new Set([...(citedWords.get(sentence) || []), ...candidate.words]));
  });
  const aboutCited = (candidate: Candidate, placement: Placement): boolean => {
    if (placement.exact || placement.codeHit || placement.score >= ECHO_COVERAGE) { return true; }

    const { words } = sentences[placement.sentence];
    const cited = citedWords.get(placement.sentence) || new Set<string>();
    const explainedWords = Array.from(words.keys()).filter((word) => cited.has(word) || candidate.words.has(word));
    return explainedWords.length >= words.size * SENTENCE_SHARE;
  };
  const placements = pick(aboutCited);

  // Order a sentence's citations by where each is mentioned, preferring the
  // first word no co-cited headline shares.
  placements.forEach((placement, candidate) => {
    if (placement.exact || placement.codeHit) { return; }

    const neighbours = Array.from(placements.entries())
      .filter(([other, { sentence }]) => other !== candidate && sentence === placement.sentence)
      .map(([other]) => other);
    const own = placement.matched.filter((word) => neighbours.every((other) => !other.words.has(word)));
    const words = sentences[placement.sentence].words;
    if (own.length > 0) { placement.position = Math.min(...own.map((word) => words.get(word))); }
  });

  return placements;
};

const layoutAgentReply = (text: string, { sources = [], explicit = [], fallback = null }: AgentReplyLayoutOptions = {}): AgentReplyLayout => {
  const display = formatAgentAnswer(text);
  const candidates = buildCandidates(text, display, sources, explicit);
  const ranges = sentenceRanges(display);
  const placements = placeCandidates(display, ranges, candidates);

  const inline = new Map<number, Array<{ candidate: Candidate; placement: Placement }>>();
  placements.forEach((placement, candidate) => {
    inline.set(placement.sentence, [...(inline.get(placement.sentence) || []), { candidate, placement }]);
  });

  // Whitespace before a sentence opens its segment, so a citation sits right
  // after the sentence's last character. Uncited text joins the next segment.
  const segments: AgentReplySegment[] = [];
  let cursor = 0;
  ranges.forEach(([, end], index) => {
    const hosted = inline.get(index);
    if (!hosted) { return; }

    const citations = hosted
      .sort((a, b) => a.placement.position - b.placement.position || candidates.indexOf(a.candidate) - candidates.indexOf(b.candidate))
      .map(({ candidate }) => candidate.citation);
    segments.push({ text: display.slice(cursor, end), citations });
    cursor = end;
  });
  if (cursor < display.length || segments.length === 0) {
    segments.push({ text: display.slice(cursor), citations: [] });
  }

  const trailing = candidates
    .filter((candidate) => candidate.always && !placements.has(candidate))
    .map(({ citation }) => citation);
  const fallbackCitation = fallback ? mergeAgentCitations([fallback])[0] : undefined;
  if (placements.size === 0 && trailing.length === 0 && fallbackCitation) {
    trailing.push({ title: headlineOf(fallbackCitation.title), url: fallbackCitation.url });
  }

  return { segments, trailing };
};

export { formatAgentAnswer, layoutAgentReply };
