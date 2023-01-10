/* eslint-disable indent */

const controlsOrder = ({ interfaceStyle, position, isMobile, isAdvert }) => (
    interfaceStyle === "screen"                                       ? "symmetrical"
  : interfaceStyle === "large"    && isMobile                         ? "symmetrical"
  : interfaceStyle === "standard" && position === "left"              ? "left-to-right"
  : interfaceStyle === "standard" && isMobile                         ? "right-to-left"
  : interfaceStyle === "standard" && position === "right" && isAdvert ? "right-to-left"
  : interfaceStyle === "standard" && position === "right"             ? "left-to-right-but-swap-ends"
  : interfaceStyle === "small"    && position === "left"              ? "left-to-right"
  : interfaceStyle === "small"    && position === "right"             ? "right-to-left"
  : interfaceStyle === "video"    && position === "left"              ? "left-to-right"
  : interfaceStyle === "video"    && isMobile                         ? "right-to-left"
  : interfaceStyle === "video"    && position === "right"             ? "right-to-left"
                                  :                                     "left-to-right"
);

export default controlsOrder;
