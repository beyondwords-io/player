const playerStyles = ["default", "small", "standard", "large", "screen", "video"];

const knownPlayerStyle = (style) => playerStyles.indexOf(style) !== -1;

export default playerStyles;
export { knownPlayerStyle };
