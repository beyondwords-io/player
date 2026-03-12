// Single lookup table for all character normalization (whitespace + typographic).
// Avoids per-char regex — one hash lookup instead.
const CHAR_MAP = {
  // Whitespaces
  "\u00A0": " ", // non-breaking space
  "\u2000": " ", "\u2001": " ", "\u2002": " ", "\u2003": " ", "\u2004": " ",
  "\u2005": " ", "\u2006": " ", "\u2007": " ", "\u2008": " ", "\u2009": " ",
  "\u200A": " ", // various typographic spaces
  "\u202F": " ", // narrow no-break space
  "\u205F": " ", // medium mathematical space
  "\u3000": " ", // ideographic space

  // Single quotes: /[`ʹʻʼʽˊˋ''‚‛′‵]/
  "\u0060": "'", // grave accent
  "\u02B9": "'", // modifier letter prime
  "\u02BB": "'", // modifier letter turned comma
  "\u02BC": "'", // modifier letter apostrophe
  "\u02BD": "'", // modifier letter reversed comma
  "\u02CA": "'", // modifier letter acute accent
  "\u02CB": "'", // modifier letter grave accent
  "\u2018": "'", // left single quotation mark
  "\u2019": "'", // right single quotation mark (smart apostrophe)
  "\u201A": "'", // single low-9 quotation mark
  "\u201B": "'", // single high-reversed-9 quotation mark
  "\u2032": "'", // prime
  "\u2035": "'", // reversed prime

  // Double quotes: /[«»ʺˮ""„‟″‶]/
  "\u00AB": "\"", // left-pointing double angle quotation mark
  "\u00BB": "\"", // right-pointing double angle quotation mark
  "\u02BA": "\"", // modifier letter double prime
  "\u02EE": "\"", // modifier letter double apostrophe
  "\u201C": "\"", // left double quotation mark
  "\u201D": "\"", // right double quotation mark
  "\u201E": "\"", // double low-9 quotation mark
  "\u201F": "\"", // double high-reversed-9 quotation mark
  "\u2033": "\"", // double prime
  "\u2036": "\"", // reversed double prime

  // Dashes: /[\u2010-\u2015]/
  "\u2010": "-", // hyphen
  "\u2011": "-", // non-breaking hyphen
  "\u2012": "-", // figure dash
  "\u2013": "-", // en dash
  "\u2014": "-", // em dash
  "\u2015": "-", // horizontal bar
};

const normalizeChar = (ch) => CHAR_MAP[ch] || ch;

const normalizeText = (text) =>
  text.split("").map(normalizeChar).join("");

const buildCharMap = (element) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const charMap = [], parts = [];
  let node;

  while ((node = walker.nextNode())) {
    const text = node.nodeValue || "";
    for (let i = 0; i < text.length; i++) {
      charMap.push({ node, offset: i });
      parts.push(normalizeChar(text[i]));
    }
  }

  return { charMap, normalizedText: parts.join("") };
};

const buildWordRanges = (normalizedText, words) => {
  const trimmed = normalizedText.replace(/^\s+/, "");
  const leadingWs = normalizedText.length - trimmed.length;
  const wordRanges = [];
  let searchPos = leadingWs;

  for (const word of (words || [])) {
    const normalizedWord = normalizeText(word.text);
    const foundPos = normalizedText.indexOf(normalizedWord, searchPos);
    if (foundPos !== -1) {
      wordRanges.push({
        startIndex: foundPos,
        endIndex: foundPos + normalizedWord.length,
        startTime: word.startTime * 1000,
        duration: word.duration * 1000,
      });
      searchPos = foundPos + normalizedWord.length;
    }
  }

  return wordRanges;
};

const findCurrentWordIndex = (currentTimeMs, wordRanges, segmentDurationMs = Infinity) => {
  for (let i = 0; i < wordRanges.length; i++) {
    const word = wordRanges[i];
    const endTime = word.duration > 0
      ? word.startTime + word.duration
      : (i + 1 < wordRanges.length ? wordRanges[i + 1].startTime : segmentDurationMs);

    if (currentTimeMs >= word.startTime && currentTimeMs < endTime) {
      return i;
    }
  }
  return -1;
};

const getRangeRects = (charMap, startIndex, endIndex, containerRect) => {
  if (startIndex >= charMap.length || endIndex > charMap.length) return [];

  const startPoint = charMap[startIndex];
  const endPoint = charMap[Math.min(endIndex - 1, charMap.length - 1)];
  if (!startPoint || !endPoint) return [];

  const range = document.createRange();
  try {
    range.setStart(startPoint.node, startPoint.offset);
    range.setEnd(endPoint.node, endPoint.offset + 1);
  } catch (e) {
    return [];
  }

  return Array.from(range.getClientRects())
    .filter(rect => rect.width > 0 && rect.height > 0)
    .map(rect => ({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    }));
};

// Merge per-inline-element rects into one rect per visual line
// to avoid double-opacity artifacts from <strong>, <a>, etc.
const mergeLineRects = (clientRects, containerRect) => {
  const rects = Array.from(clientRects).filter(r => r.width > 0 && r.height > 0);
  if (rects.length === 0) return [];

  const lines = [{ left: rects[0].left, top: rects[0].top, right: rects[0].right, bottom: rects[0].bottom }];

  for (let i = 1; i < rects.length; i++) {
    const r = rects[i];
    const line = lines[lines.length - 1];
    const midY = (r.top + r.bottom) / 2;
    const sameLine = midY >= line.top && midY <= line.bottom;

    if (sameLine) {
      line.left = Math.min(line.left, r.left);
      line.right = Math.max(line.right, r.right);
      line.bottom = Math.max(line.bottom, r.bottom);
    } else {
      lines.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
  }

  return lines.map(l => ({
    x: l.left - containerRect.left,
    y: l.top - containerRect.top,
    width: l.right - l.left,
    height: l.bottom - l.top,
  }));
};

const getTextRects = (charMap, containerRect) => {
  if (charMap.length === 0) return [];

  const range = document.createRange();
  try {
    range.setStart(charMap[0].node, charMap[0].offset);
    range.setEnd(charMap[charMap.length - 1].node, charMap[charMap.length - 1].offset + 1);
  } catch (e) {
    return [];
  }

  return mergeLineRects(range.getClientRects(), containerRect);
};

export { buildCharMap, buildWordRanges, findCurrentWordIndex, getRangeRects, getTextRects, mergeLineRects };
