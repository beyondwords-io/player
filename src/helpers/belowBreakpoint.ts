/* eslint-disable indent */

const belowBreakpoint = ({ playerStyle, width }) => (
  playerStyle === "standard" && width < 380 ||
  playerStyle === "large"    && width < 380 ||
  playerStyle === "video"    && width < 480 ||
  playerStyle === "screen"   && width < 640
);

export default belowBreakpoint;
