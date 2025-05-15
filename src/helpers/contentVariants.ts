const contentVariantHasSection = (summary, section) => {
  if (summary) {
    return section === "summary";
  } else {
    return section === "title" || section === "body";
  }
};

export { contentVariantHasSection };
