import * as stackTraceParser from "stacktrace-parser";

const loadStyle = () => {
  const thisFilename = originFilename(new Error());
  const isDevelopment = thisFilename?.match(/loadStyle.ts/); // Not minified.

  if (isDevelopment) { return; } // Already loaded by vite server.

  // If we don't set this to a variable first, the ./bin/build script will check
  // that the file exists and will fail because it doesn't until after the build.
  const externalPath = "./style.js";
  import(externalPath /* @vite-ignore */);
};

const originFilename = (error) => (
  stackTraceParser.parse(error?.stack || "")[0]?.file
);

export default loadStyle;
