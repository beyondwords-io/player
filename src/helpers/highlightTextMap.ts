const WHITESPACE_RE = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;
const normalizeWhitespace = (text) => text.replace(WHITESPACE_RE, " ");

const buildCharMap = (element) => {
  const charMap = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node;
  let normalizedText = "";

  while ((node = walker.nextNode())) {
    const text = node.nodeValue || "";
    for (let i = 0; i < text.length; i++) {
      charMap.push({ node, offset: i });
      normalizedText += WHITESPACE_RE.test(text[i]) ? " " : text[i];
    }
  }

  return { charMap, normalizedText };
};

const buildWordRanges = (normalizedText, words) => {
  const trimmed = normalizedText.replace(/^\s+/, "");
  const leadingWs = normalizedText.length - trimmed.length;
  const wordRanges = [];
  let searchPos = leadingWs;

  for (const word of (words || [])) {
    const normalizedWord = normalizeWhitespace(word.text);
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

const findCurrentWordIndex = (currentTimeMs, wordRanges) => {
  for (let i = 0; i < wordRanges.length; i++) {
    const word = wordRanges[i];
    const endTime = word.duration > 0
      ? word.startTime + word.duration
      : (i + 1 < wordRanges.length ? wordRanges[i + 1].startTime : Infinity);

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
    const sameLine = Math.abs(r.top - line.top) < line.bottom - line.top;

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
