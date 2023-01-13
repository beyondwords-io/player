/* eslint-disable indent */

const belowBreakpoint = ({ activeStyle, width }) => (
  activeStyle === "standard" && width < 380 ||
  activeStyle === "large"    && width < 380 ||
  activeStyle === "video"    && width < 480 ||
  activeStyle === "screen"   && width < 640
);

export default belowBreakpoint;
