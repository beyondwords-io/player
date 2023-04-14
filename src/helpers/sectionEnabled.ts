const sectionEnabled = (type, segment, sections) => {
  let [currentSections, hoveredSections] = sections.split("-");
  hoveredSections ||= currentSections;

  const typeSections = type === "current" ? currentSections : hoveredSections;
  return typeSections === "all" || typeSections === "body" && segment?.section === "body";
};

export default sectionEnabled;
