const contentVariants = ["article", "summary"];

const knownContentVariant = (contentVariant) => contentVariants.indexOf(contentVariant) !== -1;

export default contentVariants;
export { knownContentVariant };
