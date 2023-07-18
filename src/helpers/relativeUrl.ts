import * as stackTraceParser from "stacktrace-parser";

const relativeUrl = (filename) => {
  const error = new Error();
  const url = stackTraceParser.parse(error.stack || "")[0]?.file;

  if (!filename) { return url; }

  const parts = url.split("/");
  parts[parts.length - 1] = filename;

  return parts.join("/");
};

export default relativeUrl;
