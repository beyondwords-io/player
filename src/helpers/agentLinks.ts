import type { AgentCitation } from "./agentContracts";

const LINK_PATTERN = /\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|`(https:\/\/[^`\s<]+)`|(https:\/\/[^\s<`]+)/gi;
const SIMPLE_TRAILING_PUNCTUATION = /[.,!?;:]$/;
const CLOSING_BRACKETS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const QUOTED_TITLE_PATTERN = /["“]([^"”\n]{2,240})["”]/g;
const LINK_CLAUSE_PATTERN = /\s*(?:you can (?:find|read) it at|you can find it here|read it at|the link is|link|source)\s*:?\s*(?=[.,!?;:]?(?:\s|$))/gi;
const REMOVED_LINK_MARKER = "\uE000";
const GENERIC_LINK_TEXT = /^(?:and|at|or|link|source|url|here(?: it is|'s the link)?|you can (?:find|read) it (?:at|here)|read (?:it|more) (?:at|here)|the (?:link|url)(?: is)?|(?:find|read) it here)$/i;

const safeHttpsUrl = (raw: unknown): URL | null => {
  if (typeof raw !== "string") { return null; }

  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
};

const trimTrailingPunctuation = (raw: string): { url: string; trailing: string } => {
  let url = raw;
  let trailing = "";

  while (SIMPLE_TRAILING_PUNCTUATION.test(url)) {
    trailing = url.slice(-1) + trailing;
    url = url.slice(0, -1);
  }

  while (url.length > 0) {
    const closing = url.slice(-1);
    const opening = CLOSING_BRACKETS[closing];
    if (!opening) { break; }

    const openingCount = url.split(opening).length - 1;
    const closingCount = url.split(closing).length - 1;
    if (closingCount <= openingCount) { break; }

    trailing = closing + trailing;
    url = url.slice(0, -1);
  }

  return { url, trailing };
};

const allowedHttpsUrl = (raw: string): string | null => {
  const url = safeHttpsUrl(raw);
  if (!url) { return null; }
  return url.href;
};

const agentTextWithoutLinks = (text: string): string => {
  let removedLink = false;

  // Keep a human Markdown label in the sentence; bare and code-wrapped URLs
  // move to the citation row instead of dominating the answer copy.
  const withoutLinks = text.replace(LINK_PATTERN, (_match, markdownLabel, markdownUrl, codeUrl, bareUrl) => {
    removedLink = true;
    if (markdownLabel) { return markdownLabel; }

    const raw = markdownUrl || codeUrl || bareUrl;
    return REMOVED_LINK_MARKER + trimTrailingPunctuation(raw).trailing;
  });

  if (!removedLink) { return text; }

  return withoutLinks
    // Remove an entire URL-only line, without collapsing intentional blank
    // lines elsewhere in the response.
    .replace(/^\s*\uE000[.,!?;:]*[ \t]*(?:\n|$)/gm, "")
    .replaceAll(REMOVED_LINK_MARKER, "")
    .replace(LINK_CLAUSE_PATTERN, "")
    // An agent will often introduce a bare URL with "and" or "at". Once the
    // URL moves to a pill, remove the connector if it is left at the line end.
    .replace(/\s+(?:and|at)\s*(?=[.,!?;:]?(?:\n|$))/gim, "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.!?])(["”])\./g, "$1$2")
    .trim();
};

const nearestQuotedTitle = (text: string): string | null => {
  let title: string | null = null;

  for (const match of text.matchAll(QUOTED_TITLE_PATTERN)) {
    title = match[1].trim().replace(/\.$/, "");
  }

  return title;
};

const listItemTitle = (text: string): string | null => {
  const match = text.trim().match(/^(?:\d+[.)]|[-*•])\s+(.+)$/);
  if (!match) { return null; }

  return match[1]
    .replace(/\s*(?:[-–—:|]|\band)\s*$/i, "")
    .trim()
    .replace(/\.$/, "") || null;
};

const plainLineTitle = (text: string): string | null => {
  if (text.includes("https://")) { return null; }

  const title = text
    .trim()
    .replace(/^(?:\d+[.)]|[-*•])\s+/, "")
    .replace(/\s*(?:[-–—:|]|\band)\s*$/i, "")
    .trim()
    .replace(/\.$/, "");

  if (!title || title.length > 240 || GENERIC_LINK_TEXT.test(title)) { return null; }
  return title;
};

const nearbyLineTitle = (prefix: string): string | null => {
  const lines = prefix.split("\n");
  const currentLine = lines.pop() || "";
  const previousLine = lines.reverse().find((line) => line.trim()) || "";

  return nearestQuotedTitle(currentLine)
    || listItemTitle(currentLine)
    || plainLineTitle(currentLine)
    || nearestQuotedTitle(previousLine)
    || listItemTitle(previousLine)
    || plainLineTitle(previousLine);
};

const agentCitationsFromText = (text: string): AgentCitation[] => {
  const citations: AgentCitation[] = [];

  for (const match of text.matchAll(LINK_PATTERN)) {
    const markdownLabel = match[1]?.trim();
    const raw = match[2] || match[3] || match[4];
    const { url } = trimTrailingPunctuation(raw);
    const href = allowedHttpsUrl(url);
    if (!href) { continue; }

    const hostname = new URL(href).hostname.replace(/^www\./, "");
    const prefix = text.slice(0, match.index ?? 0);
    citations.push({
      title: markdownLabel || nearbyLineTitle(prefix) || hostname,
      url: href,
    });
  }

  return mergeAgentCitations(citations);
};

const mergeAgentCitations = (...groups: AgentCitation[][]): AgentCitation[] => {
  const citations = new Map<string, AgentCitation>();

  groups.flat().forEach((citation) => {
    const url = safeHttpsUrl(citation?.url);
    if (!url || citations.has(url.href)) { return; }
    citations.set(url.href, { title: citation.title?.trim() || url.hostname, url: url.href });
  });

  return Array.from(citations.values());
};

const agentCitationsFromToolResult = (payload: unknown): AgentCitation[] => {
  const citations: AgentCitation[] = [];

  const visit = (value: unknown, depth = 0): void => {
    if (depth > 10 || value === null || value === undefined) { return; }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) { return; }

      try {
        visit(JSON.parse(trimmed), depth + 1);
      } catch {
        return;
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }

    if (typeof value !== "object") { return; }

    const record = value as Record<string, unknown>;
    const sourceUrl = record.sourceUrl ?? record.source_url;
    const url = safeHttpsUrl(sourceUrl);
    if (url) {
      const title = typeof record.title === "string" && record.title.trim() ? record.title.trim() : url.hostname;
      citations.push({ title, url: url.href });
    }

    Object.values(record).forEach((item) => visit(item, depth + 1));
  };

  visit(payload);
  return mergeAgentCitations(citations);
};

const citationsForAgentText = (text: string, candidates: AgentCitation[]): AgentCitation[] => {
  const unique = mergeAgentCitations(candidates);
  if (unique.length <= 1) { return unique; }

  const normalizedText = text.toLowerCase().replace(/\s+/g, " ");
  return unique.filter(({ title, url }) => (
    text.includes(url) || normalizedText.includes(title.toLowerCase().replace(/\s+/g, " "))
  ));
};

export {
  agentCitationsFromText,
  agentCitationsFromToolResult,
  agentTextWithoutLinks,
  citationsForAgentText,
  mergeAgentCitations,
};
