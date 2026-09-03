import type { AgentCitation } from "./agentContracts";

const LINK_PATTERN = /\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|`(https:\/\/[^`\s<]+)`|(https:\/\/[^\s<`]+)/gi;
const SIMPLE_TRAILING_PUNCTUATION = /[.,!?;:]$/;
const CLOSING_BRACKETS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const QUOTED_TITLE_PATTERN = /["“]([^"”\n]{2,240})["”]/g;
const LINK_CLAUSE_PATTERN = /\s*(?:you can (?:find|read) it at|you can find it here|read it at|the link is|link|source)\s*:?\s*(?=[.,!?;:]?(?:\s|$))/gi;

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

const agentTextWithoutLinks = (text: string): string => text
  // Keep a human Markdown label in the sentence; bare and code-wrapped URLs
  // move to the citation row instead of dominating the answer copy.
  .replace(LINK_PATTERN, (_match, markdownLabel) => markdownLabel || "")
  .replace(LINK_CLAUSE_PATTERN, "")
  .replace(/\s+([.,!?;:])/g, "$1")
  .replace(/([.!?])(["”])\./g, "$1$2")
  .trim();

const nearestQuotedTitle = (text: string): string | null => {
  let title: string | null = null;

  for (const match of text.matchAll(QUOTED_TITLE_PATTERN)) {
    title = match[1].trim().replace(/\.$/, "");
  }

  return title;
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
      title: markdownLabel || nearestQuotedTitle(prefix) || hostname,
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
