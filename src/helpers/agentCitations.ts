import type { AgentCitation, AgentReplyLayout, AgentReplySegment } from "./agentContracts";
import { agentCitationsFromText, agentTextWithoutLinks, mergeAgentCitations } from "./agentLinks";

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

interface Sentence {
  start: number;
  end: number;
  words: Map<string, number>;
  codes: Map<string, number>;
}

interface Candidate {
  citation: AgentCitation;
  always: boolean;
  names: string[][];
  words: Set<string>;
  codes: Set<string>;
}

interface Placement {
  sentence: number;
  score: number;
  position: number;
  codeHit: boolean;
  exact: boolean;
  matched: string[];
}

// Thresholds tuned against the corpus in test/fixtures/agentCitationsCorpus.ts.
// A wrong link is worse than a missing one, so each errs towards precision.
const MIN_COVERAGE = 0.6;
const MIN_MATCHED = 3;
const SHORT_HEADLINE_WORDS = 4;
const SHORT_HEADLINE_COVERAGE = 0.75;
const FOREIGN_CODE_COVERAGE = 0.8;
const DISTINCT_MATCHED = 2;
const DISTINCT_COVERAGE = 0.25;
const EXACT_SCORE = 3;

const TOKEN_PATTERN = /[a-z0-9]+(?:[/.\-'][a-z0-9]+)*/g;
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const QUOTE_MARKS = /[‘’‛′`´ʼ]/g;
const HYPHENS = /[‐‑‒]/g;
const FIGURE = /^\d+(?:\.\d+)?(?:bn|m|k|pc|p|ppt|x|st|nd|rd|th|s|tn|trn|bps|bp|mw|gw|kw|gb|tb|mph|kg|km)$/;
const STRONG_CODE = /^[a-z]+\d+[/-]\d+$/;
const NUMBER = /^\d+(?:\.\d+)*$/;
const NUMBER_PAIR = /^\d+[/-]\d+$/;
const SENTENCE_END = /[.!?…]+["'”’)\]]*(?=[^\S\n]+(?:[A-Z0-9À-ÖØ-Þ]|["'“‘«(\[]))/g;

const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "st", "vs", "etc", "e.g", "i.e", "inc", "ltd", "co", "corp", "u.s", "u.k", "a.m", "p.m",
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
  "plus", "however", "okay", "sure",
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

// Just enough stemming that "proposes", "proposed" and "proposal's" verb all
// meet at "propos"; it only has to agree with itself.
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
    while (i + 1 < pieces.length && touching(pieces[i], pieces[i + 1], /^[\s-]*$/)) {
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
      token.word = stem(raw);
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
          if (lower === "no" && /^\s+\d/.test(line.slice(end))) { continue; }
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

const indexOfSequence = (haystack: string[], needle: string[]): number => {
  if (needle.length === 0) { return -1; }

  for (let i = 0; i + needle.length <= haystack.length; i++) {
    let j = 0;
    while (j < needle.length && haystack[i + j] === needle[j]) { j++; }
    if (j === needle.length) { return i; }
  }
  return -1;
};

const buildCandidates = (text: string, sources: AgentCitation[], explicit: AgentCitation[]): Candidate[] => {
  const given = mergeAgentCitations(explicit);
  const written = mergeAgentCitations(agentCitationsFromText(text));
  const known = mergeAgentCitations(sources);
  const byUrl = new Map(known.map((source) => [source.url, source]));
  const candidates: Candidate[] = [];
  const seen = new Set<string>();

  const add = (citation: AgentCitation, always: boolean, alias?: string) => {
    const headline = headlineOf(citation.title);
    const tokens = tokenize(headline);
    const key = tokens.map(({ seq }) => seq).join(" ");
    if (seen.has(citation.url) || (!always && seen.has(key))) { return; }
    seen.add(citation.url);
    seen.add(key);

    const names = [tokens.map(({ seq }) => seq)];
    if (alias) { names.push(tokenize(headlineOf(alias)).map(({ seq }) => seq)); }

    candidates.push({
      citation: { title: headline, url: citation.url },
      always,
      names: names.filter((name) => name.length > 0),
      words: new Set(tokens.map(({ word }) => word).filter(Boolean)),
      codes: new Set(tokens.map(({ code }) => code).filter(Boolean)),
    });
  };

  given.forEach((citation) => add(citation, true));
  // A link the agent wrote takes its source's headline when a tool returned
  // it; the title guessed from the reply still finds it word for word.
  written.forEach((citation) => {
    const source = byUrl.get(citation.url);
    add(source || citation, true, source ? citation.title : undefined);
  });
  known.forEach((citation) => add(citation, false));

  return candidates;
};

const placeCandidates = (display: string, ranges: Array<[number, number]>, candidates: Candidate[]): Map<Candidate, Placement> => {
  const tokens = tokenize(display);
  const sentences: Sentence[] = ranges.map(([start, end]) => ({
    start, end, words: new Map(), codes: new Map(),
  }));
  tokens.forEach((token) => {
    const sentence = sentences[sentenceAt(sentences, token.start)];
    if (!sentence) { return; }
    if (token.word && !sentence.words.has(token.word)) { sentence.words.set(token.word, token.start); }
    if (token.code && !sentence.codes.has(token.code)) { sentence.codes.set(token.code, token.start); }
  });

  // Rarer words weigh more: ln(1 + N / df) over the candidates' headlines.
  const documentFrequency = new Map<string, number>();
  const codeOwners = new Map<string, number>();
  candidates.forEach(({ words, codes }) => {
    words.forEach((word) => documentFrequency.set(word, (documentFrequency.get(word) || 0) + 1));
    codes.forEach((code) => codeOwners.set(code, (codeOwners.get(code) || 0) + 1));
  });
  const weight = (word: string) => Math.log(1 + candidates.length / (documentFrequency.get(word) || 1));
  const weightOf = (words: Iterable<string>) => Array.from(words).reduce((sum, word) => sum + weight(word), 0);

  const sequence = tokens.map(({ seq }) => seq);
  const matches = new Map<Candidate, Placement[]>();

  candidates.forEach((candidate) => {
    const found: Placement[] = [];
    const exact = candidate.names
      .map((name) => ({ name, at: indexOfSequence(sequence, name) }))
      .filter(({ at }) => at >= 0)
      .sort((a, b) => a.at - b.at)[0];

    if (exact) {
      const sentence = sentenceAt(sentences, tokens[exact.at + exact.name.length - 1].start);
      found.push({ sentence, score: EXACT_SCORE, position: tokens[exact.at].start, codeHit: false, exact: true, matched: [] });
    }

    const total = weightOf(candidate.words);
    sentences.forEach((sentence, index) => {
      const matched = Array.from(candidate.words).filter((word) => sentence.words.has(word));
      const coverage = total > 0 ? weightOf(matched) / total : 0;
      const ownCodes = Array.from(candidate.codes).filter((code) => sentence.codes.has(code));
      const codeHit = ownCodes.some((code) => codeOwners.get(code) === 1);
      const foreignCode = Array.from(sentence.codes.keys()).some((code) => codeOwners.has(code) && !candidate.codes.has(code));

      // Another story's code says this sentence is about that story.
      if (foreignCode && ownCodes.length === 0 && coverage < FOREIGN_CODE_COVERAGE) { return; }

      const enoughWords = candidate.words.size >= 2 && (
        (coverage >= MIN_COVERAGE && matched.length >= MIN_MATCHED)
        || (coverage >= SHORT_HEADLINE_COVERAGE && matched.length >= 2 && candidate.words.size <= SHORT_HEADLINE_WORDS)
      );
      if (!codeHit && !enoughWords) { return; }

      const position = codeHit
        ? Math.min(...ownCodes.map((code) => sentence.codes.get(code)))
        : Math.min(...matched.map((word) => sentence.words.get(word)));
      found.push({ sentence: index, score: codeHit ? 1 + coverage : coverage, position, codeHit, exact: false, matched });
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

  const placements = new Map<Candidate, Placement>();
  matches.forEach((found, candidate) => {
    const best = found
      .filter((placement) => !explained(candidate, placement))
      .sort((a, b) => b.score - a.score || a.sentence - b.sentence)[0];
    if (best) { placements.set(candidate, best); }
  });

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
  const candidates = buildCandidates(text, sources, explicit);
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

export type { AgentReplyLayoutOptions };
export { formatAgentAnswer, layoutAgentReply };
