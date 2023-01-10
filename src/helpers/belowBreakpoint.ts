/* eslint-disable indent */

const belowBreakpoint = ({ interfaceStyle, width }) => (
  interfaceStyle === "standard" && width < 380 ||
  interfaceStyle === "large"    && width < 380 ||
  interfaceStyle === "video"    && width < 480 ||
  interfaceStyle === "screen"   && width < 640
);

export default belowBreakpoint;
