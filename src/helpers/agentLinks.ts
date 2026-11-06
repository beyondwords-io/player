import type { AgentCitation } from "./agentContracts";

const LINK_PATTERN = /\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|`(https:\/\/[^`\s<]+)`|(https:\/\/[^\s<`]+)/gi;
const SIMPLE_TRAILING_PUNCTUATION = /[.,!?;:]$/;
const CLOSING_BRACKETS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const QUOTED_TITLE_PATTERN = /["“]([^"”\n]{2,240})["”]/g;
const LINK_CLAUSE_PATTERN = /\s*(?:you can (?:find|read) it at|you can find it here|read it at|the link is|link|source)\s*:?\s*(?=[.,!?;:]?(?:\s|$))/gi;
const REMOVED_LINK_MARKER = "\uE000";
const GENERIC_LINK_TEXT = /^(?:and|at|or|this|more|link|source|url|website|here(?: it is|'s the link)?|(?:click|tap) here|you can (?:find|read) it (?:at|here)|read (?:it|more|on)(?: (?:at|here))?|the (?:link|url|source)(?: is)?|(?:find|read) it here|(?:the |this )?(?:full )?(?:article|story|piece|report)(?: here)?)$/i;
// An unclosed bracket at the end of a line leads into a link: "(read it".
const OPEN_LINK_LEAD = /\s*\((?![^()]*\))[^()]*$/;

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
    .replace(OPEN_LINK_LEAD, "")
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
    // "Read it [here](…)" names nothing: title it like a bare URL instead.
    const label = markdownLabel && !GENERIC_LINK_TEXT.test(markdownLabel) ? markdownLabel : "";
    citations.push({
      title: label || nearbyLineTitle(prefix) || hostname,
      url: href,
    });
  }

  return mergeAgentCitations(citations);
};

// The reply with each Markdown link's label wrapped in the marks `mark`
// returns for it (or left alone for null), so where a label lands in
// agentTextWithoutLinks' copy can be read back from the marks.
const markAgentLinkLabels = (text: string, mark: (url: string, index: number) => [string, string] | null): string => {
  let index = -1;

  return text.replace(LINK_PATTERN, (match, markdownLabel, markdownUrl) => {
    if (!markdownLabel) { return match; }

    const href = allowedHttpsUrl(trimTrailingPunctuation(markdownUrl).url);
    if (!href) { return match; }

    index += 1;
    const marks = mark(href, index);
    return marks ? `[${marks[0]}${markdownLabel}${marks[1]}](${markdownUrl})` : match;
  });
};

// One article whatever the agent did to its link: the host without www, no
// trailing slash and no tracking parameters. The fragment stays, since a
// citation can point at one segment of an article.
const agentCitationKey = (href: string): string => {
  const url = safeHttpsUrl(href);
  if (!url) { return href; }

  const params = new URLSearchParams(Array.from(url.searchParams).filter(([name]) => !/^utm_/i.test(name)));
  const search = params.toString();
  return `${url.host.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}${search ? `?${search}` : ""}${url.hash}`;
};

const mergeAgentCitations = (...groups: AgentCitation[][]): AgentCitation[] => {
  const citations = new Map<string, AgentCitation>();

  groups.flat().forEach((citation) => {
    const url = safeHttpsUrl(citation?.url);
    if (!url) { return; }

    const key = agentCitationKey(url.href);
    if (citations.has(key)) { return; }
    citations.set(key, { title: citation.title?.trim() || url.hostname, url: url.href });
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
      // A title may arrive as several lines: the headline, then the
      // article's own subheadings.
      const headline = typeof record.title === "string" ? record.title.split("\n").map((line) => line.trim()).find(Boolean) : "";
      citations.push({ title: headline || url.hostname, url: url.href });
    }

    Object.values(record).forEach((item) => visit(item, depth + 1));
  };

  visit(payload);
  return mergeAgentCitations(citations);
};

export {
  agentCitationKey,
  agentCitationsFromText,
  agentCitationsFromToolResult,
  agentTextWithoutLinks,
  markAgentLinkLabels,
  mergeAgentCitations,
};
