// This file doesn't actually do anything. It serves as a marker whose import
// line can be replaced during the build process to load the aggregate styles.
//
// Note that you should always load this file with a dynamic import rather than
// a static once or it will not work, i.e. import("../helpers/loadTheStyles.ts")
//
// In development mode, the styles have already loaded because of HMR so call stylesLoaded() now.
// In production mode, call it after styles are appended to <head> (see ./bin/vendor_style).
BeyondWords.Player.styleLoaded();
