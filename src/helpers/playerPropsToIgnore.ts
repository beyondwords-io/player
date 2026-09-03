const playerPropsToIgnore = new Set([
  "addEventListener",
  "removeEventListener",
  "mediaElement",
  "userInterface",
  "widgetInterface",
  "controller",
  "videoPlayerStyleAlias",

  // Debugging aids, and a fresh object on every response, so they would add
  // noise to every event's changedProps and to analytics.
  "apiPayload",
  "apiRequestUrl",
  "apiProps",
  "projectTheme",
  "apiLightTheme",
  "apiDarkTheme",
  "apiVideoTheme",
  "resolvedLightTheme",
  "resolvedDarkTheme",
  "resolvedVideoTheme",
  "resolvedThemePreference",
]);

export default playerPropsToIgnore;
