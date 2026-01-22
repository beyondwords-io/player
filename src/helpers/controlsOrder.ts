/* eslint-disable indent */

const controlsOrder = ({ playerStyle, position, isMobile, isAdvert }) => {
  if (playerStyle === "screen" || playerStyle === "large" && isMobile) {
    return "symmetrical";
  } else {
    return "left-to-right";
  }
};

export default controlsOrder;
