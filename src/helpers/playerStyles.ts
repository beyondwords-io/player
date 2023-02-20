const playerStyles = ["small", "standard", "large", "screen", "video"];

const knownPlayerStyle = (style) => playerStyles.indexOf(style) !== -1;

export default playerStyles;
export { knownPlayerStyle };
