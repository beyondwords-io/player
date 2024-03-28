const contentVariants = ["article", "summary"];

const knownContentVariant = (contentVariant) => contentVariants.indexOf(contentVariant) !== -1;

const playableContentVariant = (contentVariant, contentItem) => {
  if (!contentItem) return true;
  if (contentVariant === "article") return true;
  if (contentVariant === "summary" && contentItem.summary) return true;
  return false;
};

const contentVariantFallback = (contentVariant, contentItem, loadContentAs) => {
  if (playableContentVariant(contentVariant, contentItem)) return contentVariant;

  const variantIndex = loadContentAs.indexOf(contentVariant);
  return loadContentAs.slice(variantIndex + 1)
    .concat(loadContentAs.slice(0, Math.max(0, variantIndex)))
    .find(v => playableContentVariant(v, contentItem));
};

export default contentVariants;
export { knownContentVariant, contentVariantFallback };
