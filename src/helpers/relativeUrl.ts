import * as stackTraceParser from "stacktrace-parser";
import { version } from "../../package.json";

const relativeUrl = (filename) => {
  const error = new Error();
  const url = stackTraceParser.parse(error.stack || "")[0]?.file;

  if (!url) { console.warn("BeyondWords.Player: unable to load dependencies"); return ""; }
  if (!filename) { return url; }

  const pinnedUrl = url.replaceAll("player@latest", `player@${version}`);
  const relativeUrl = replaceFilename(pinnedUrl, filename);

  return relativeUrl;
};

const replaceFilename = (url, filename) => {
  const parts = url.split("/");
  parts[parts.length - 1] = filename;
  return parts.join("/");
};

export default relativeUrl;
