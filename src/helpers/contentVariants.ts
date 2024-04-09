const contentVariants = ["article", "summary"];

const knownContentVariant = (contentVariant) => contentVariants.indexOf(contentVariant) !== -1;

const contentVariantHasSection = (contentVariant, section) => {
  if (contentVariant === "article" && (section === "title" || section === "body")) return true;
  if (contentVariant === "summary" && section === "summary") return true;
  return false;
};

export default contentVariants;
export { knownContentVariant, contentVariantHasSection };
