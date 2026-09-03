// Rebuilds the article from the content the API returned, so highlighting and
// click-a-paragraph can be tested against whatever is loaded. Segments carry a
// marker, the text they were synthesized from, and their section, which is
// everything the player needs to match an element to a segment.

const rebuildArticle = (player, container) => {
  const item = player.content?.[player.contentIndex];

  if (!item?.segments?.length) {
    container.replaceChildren(placeholder(player));
    return;
  }

  const elements = [];
  let lastSection;

  item.segments.forEach((segment) => {
    const section = segment.section || "body";

    // The summary is a separate reading of the same article, so say where it
    // starts rather than running the two together.
    if (section === "summary" && lastSection !== "summary") {
      elements.push(label("Summary version"));
    }

    lastSection = section;
    elements.push(paragraph(segment, section));
  });

  container.replaceChildren(...elements);
};

// private

const paragraph = (segment, section) => {
  const element = document.createElement(section === "title" ? "h2" : "p");

  element.dataset.beyondwordsMarker = segment.marker;
  element.dataset.section = section;

  // Prefer the segment's own text: it is what the md5 was computed from, so the
  // player's fallbacks for matching an element still work. Word timings are a
  // usable fallback when the text is missing.
  element.textContent = segment.text || (segment.words || []).map((word) => word.text).join(" ");

  return element;
};

const label = (text) => {
  const element = document.createElement("h2");
  element.textContent = text;

  return element;
};

const placeholder = (player) => {
  const element = document.createElement("p");

  element.textContent = player.projectId
    ? "This content has no segments, so there is no article text to rebuild."
    : "No content loaded. Enter a project ID plus a content or playlist ID in the control panel, then Fetch. The panel is hidden on screens narrower than 1200px.";

  return element;
};

export default rebuildArticle;
export { rebuildArticle };
