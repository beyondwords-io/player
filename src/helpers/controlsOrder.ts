/* eslint-disable indent */

const controlsOrder = ({ playerStyle, position, isMobile, isAdvert }) => (
    playerStyle === "screen"                                       ? "symmetrical"
  : playerStyle === "large"    && isMobile                         ? "symmetrical"
  : playerStyle === "standard" && position === "left"              ? "left-to-right"
  : playerStyle === "standard" && isMobile                         ? "right-to-left"
  : playerStyle === "standard" && position === "right" && isAdvert ? "right-to-left"
  : playerStyle === "standard" && position === "right"             ? "left-to-right-but-swap-ends"
  : playerStyle === "small"    && position === "left"              ? "left-to-right"
  : playerStyle === "small"    && position === "right"             ? "right-to-left"
  : playerStyle === "video"    && position === "left"              ? "left-to-right"
  : playerStyle === "video"    && isMobile                         ? "right-to-left"
  : playerStyle === "video"    && position === "right"             ? "right-to-left"
                                                                   : "left-to-right"
);

export default controlsOrder;
