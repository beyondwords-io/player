import throwError from "./throwError";

const parseMargin = (margin) => {
  const parts = margin?.split(" ");

  if (parts.length === 1) { return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] }; }
  if (parts.length === 2) { return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] }; }
  if (parts.length === 3) { return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] }; }
  if (parts.length === 4) { return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }; }

  throwError(`Invalid widgetMargin: ${margin}`);
};

export default parseMargin;
