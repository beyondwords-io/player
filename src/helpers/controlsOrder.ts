/* eslint-disable indent */

const controlsOrder = ({ activeStyle, position, isMobile, isAdvert }) => (
    activeStyle === "screen"                                       ? "symmetrical"
  : activeStyle === "large"    && isMobile                         ? "symmetrical"
  : activeStyle === "standard" && position === "left"              ? "left-to-right"
  : activeStyle === "standard" && isMobile                         ? "right-to-left"
  : activeStyle === "standard" && position === "right" && isAdvert ? "right-to-left"
  : activeStyle === "standard" && position === "right"             ? "left-to-right-but-swap-ends"
  : activeStyle === "small"    && position === "left"              ? "left-to-right"
  : activeStyle === "small"    && position === "right"             ? "right-to-left"
  : activeStyle === "video"    && position === "left"              ? "left-to-right"
  : activeStyle === "video"    && isMobile                         ? "right-to-left"
  : activeStyle === "video"    && position === "right"             ? "right-to-left"
                                                                   : "left-to-right"
);

export default controlsOrder;
