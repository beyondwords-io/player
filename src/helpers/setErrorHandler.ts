import * as stackTraceParser from "stacktrace-parser";

let called = false;
let prevOnError, prevOnReject;

const setErrorHandler = ({ onError }) => {
  if (!onError || called) { return; }
  called = true;

  const thisFilename = originFilename(new Error());
  const isDevelopment = thisFilename?.match(/setErrorHandler/); // Not minified.

  prevOnError = window.onerror;
  prevOnReject = window.onunhandledrejection;

  window.onerror = (message, errorFilename, lineNumber, columnNumber, error) => {
    const originatedFromPlayer = errorFilename === thisFilename;
    const isPlaybackError = error?.message?.match(/request was interrupted/);

    const handleError = isDevelopment || originatedFromPlayer || isPlaybackError;
    if (handleError) { if (onError(error)) { return true; } }

    prevOnError && prevOnError(message, errorFilename, lineNumber, columnNumber, error);
  };

  window.onunhandledrejection = (event) => {
    const error = event.reason;

    const originatedFromPlayer = originFilename(error) === thisFilename;
    const isPlaybackError = error?.message?.match(/request was interrupted/);

    const handleError = isDevelopment || originatedFromPlayer || isPlaybackError;
    if (handleError) { if (onError(error)) { event.preventDefault(); return; } }

    prevOnReject && prevOnReject(event);
  };
};

const originFilename = (error) => (
  stackTraceParser.parse(error?.stack || "")[0]?.file
);

export default setErrorHandler;
