const playerPropsToIgnore = new Set([
  "addEventListener",
  "removeEventListener",
  "mediaElement",
  "userInterface",
  "widgetInterface",
  "controller",
]);

export default playerPropsToIgnore;
