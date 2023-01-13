const interfaceStyles = ["small", "standard", "large", "screen", "video"];

const knownInterfaceStyle = (style) => interfaceStyles.indexOf(style) !== -1;

export default interfaceStyles;
export { knownInterfaceStyle };
