import type { AgentCitation } from "./agentContracts";

type AgentTextPart =
  | { kind: "text"; text: string }
  | { kind: "link"; text: string; href: string };

const LINK_PATTERN = /\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|(https:\/\/[^\s<]+)/gi;
const SIMPLE_TRAILING_PUNCTUATION = /[.,!?;:]$/;
const CLOSING_BRACKETS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

const normalizeHost = (host: string): string => host.trim().toLowerCase().replace(/^www\./, "");

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

const appendText = (parts: AgentTextPart[], text: string): void => {
  if (!text) { return; }

  const previous = parts[parts.length - 1];
  if (previous?.kind === "text") {
    previous.text += text;
  } else {
    parts.push({ kind: "text", text });
  }
};

const allowedHttpsUrl = (raw: string, hosts: Set<string>): string | null => {
  const url = safeHttpsUrl(raw);
  if (!url || !hosts.has(normalizeHost(url.hostname))) { return null; }
  return url.href;
};

const linkHostsFromUrls = (urls: unknown[]): string[] => Array.from(new Set(urls.flatMap((raw) => {
  const url = safeHttpsUrl(raw);
  return url ? [normalizeHost(url.hostname)] : [];
})));

const agentTextParts = (text: string, allowedHosts: string[] = []): AgentTextPart[] => {
  const parts: AgentTextPart[] = [];
  const hosts = new Set(allowedHosts.map(normalizeHost));
  let index = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const start = match.index ?? 0;
    appendText(parts, text.slice(index, start));

    const markdownLabel = match[1];
    const raw = match[2] || match[3];
    const { url, trailing } = trimTrailingPunctuation(raw);
    const href = allowedHttpsUrl(url, hosts);

    if (href) {
      parts.push({ kind: "link", text: markdownLabel || url, href });
      appendText(parts, trailing);
    } else {
      appendText(parts, match[0]);
    }

    index = start + match[0].length;
  }

  appendText(parts, text.slice(index));
  return parts;
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
  agentCitationsFromToolResult,
  agentTextParts,
  citationsForAgentText,
  linkHostsFromUrls,
  mergeAgentCitations,
};
export type { AgentTextPart };
