const playerPropsToIgnore = new Set([
  "addEventListener",
  "removeEventListener",
  "mediaElement",
  "userInterface",
  "widgetInterface",
  "controller",

  // Debugging aids, and a fresh object on every response, so they would add
  // noise to every event's changedProps and to analytics.
  "apiPayload",
  "apiRequestUrl",
  "apiProps",
]);

export default playerPropsToIgnore;
