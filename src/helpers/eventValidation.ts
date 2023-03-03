import throwError from "./throwError";
import { validate as isValidUuid } from "uuid";

const initiators = ["user", "media", "browser", "google-ima-sdk"];
const postStatuses = ["handled", "ignored-due-to-advert", "ignored-due-to-scrubbing"];

export const validateEventBeforeCreation = (props) => {
  validateProperty(props, "type",        s => isTitleCase(s));
  validateProperty(props, "description", s => s.length > 0);
  validateProperty(props, "initiatedBy", s => initiators.includes(s));
};

export const validateEventBeforeProcessing = (props) => {
  validateProperty(props, "type",        s => isTitleCase(s));
  validateProperty(props, "description", s => s.length > 0);
  validateProperty(props, "initiatedBy", s => initiators.includes(s));
  validateProperty(props, "id",          s => isValidUuid(s));
  validateProperty(props, "createdAt",   s => isIsoDateString(s));
  validateProperty(props, "status",      s => s === "pending");
  validateProperty(props, "fromWidget",  b => typeof b === "boolean");
};

export const validateEventAfterProcessing = (props) => {
  validateProperty(props, "type",        s => isTitleCase(s));
  validateProperty(props, "description", s => s.length > 0);
  validateProperty(props, "initiatedBy", s => initiators.includes(s));
  validateProperty(props, "id",          s => isValidUuid(s));
  validateProperty(props, "createdAt",   s => isIsoDateString(s));
  validateProperty(props, "status",      s => postStatuses.includes(s));
  validateProperty(props, "fromWidget",  b => typeof b === "boolean");
  validateProperty(props, "processedAt", s => isIsoDateString(s));
};

const isTitleCase = (string) => {
  string = string || "<invalid>";

  const startsWithCapital = string[0] === string[0].toUpperCase();
  const hasNonAlphabetic = string.match(/[^a-zA-Z]/);

  return startsWithCapital && !hasNonAlphabetic;
};

const isIsoDateString = (string) => {
  try {
    const date = new Date(Date.parse(string));
    return date.toISOString() === string;
  } catch (error) {
    return false;
  }
}

const validateProperty = (props, name, validationFn) => {
  if (!Object.prototype.hasOwnProperty.call(props, name)) {
    throwError(`Invalid event: missing a '${name}' property`, props);
  }

  if (!validationFn(props[name])) {
    throwError(`Invalid event: '${name}: ${props[name]}' is invalid`, props);
  }
};
