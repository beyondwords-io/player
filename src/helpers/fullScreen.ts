const canFullScreen = () => (
  document.fullscreenEnabled || document.webkitFullscreenEnabled
);

const requestFullScreen = (element) => {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
};

const exitFullScreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
};

const fullScreenElement = () => (
  document.fullscreenElement || document.webkitCurrentFullScreenElement
);


export { canFullScreen, requestFullScreen, exitFullScreen, fullScreenElement };
