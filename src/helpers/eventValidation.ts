import throwError from "./throwError";
import { validate as isValidUuid } from "uuid";

const initiators = ["user", "media", "browser", "google-ima-sdk"];
const postStatuses = ["handled", "ignored-due-to-advert", "ignored-due-to-scrubbing"];
const analyticsTypes = ["load", "play", "play_progress", "ad_link_click"];
const deviceTypes = ["phone", "tablet", "desktop"];
const mediaTypes = ["content", "ad"];

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
  validateProperty(props, "type",         s => isTitleCase(s));
  validateProperty(props, "description",  s => s.length > 0);
  validateProperty(props, "initiatedBy",  s => initiators.includes(s));
  validateProperty(props, "id",           s => isValidUuid(s));
  validateProperty(props, "createdAt",    s => isIsoDateString(s));
  validateProperty(props, "status",       s => postStatuses.includes(s));
  validateProperty(props, "fromWidget",   b => typeof b === "boolean");
  validateProperty(props, "changedProps", o => typeof o === "object");
  validateProperty(props, "processedAt",  s => isIsoDateString(s));
};

export const validateAnalyticsEvent = (props) => {                                   // ClickHouse Types:
  validateProperty(props, "event_type",            s => analyticsTypes.includes(s)); // Enum
  validateProperty(props, "device_type",           s => deviceTypes.includes(s));    // Enum
  validateProperty(props, "media_type",            s => mediaTypes.includes(s));     // Enum
  validateProperty(props, "content_id",            s => !s || isValidUuid(s));       // String
  validateProperty(props, "project_id",            n => !n || n > 0);                // Int64
  validateProperty(props, "publisher_id",          n => !n || n > 0);                // Int64
  validateProperty(props, "ad_id",                 n => !n || n > 0);                // Int64
  validateProperty(props, "media_id",              n => !n || n > 0);                // Int64
  validateProperty(props, "user_id",               s => isValidUuid(s));             // String
  validateProperty(props, "listen_session_id",     s => isValidUuid(s));             // UUID
  validateProperty(props, "duration",              n => n >= 0);                     // Int32
  validateProperty(props, "listen_length_percent", n => n >= 0 && n <= 100);         // Int32
  validateProperty(props, "listen_length_seconds", n => n >= 0);                     // Int32
  validateProperty(props, "speed",                 n => n >= 0);                     // Int32
  validateProperty(props, "location",              s => s.length > 0);               // Not currently stored
  validateProperty(props, "referrer",              s => typeof s === "string");      // Not currently stored
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
};

const validateProperty = (props, name, validationFn) => {
  if (!Object.prototype.hasOwnProperty.call(props, name)) {
    throwError(`Invalid event: missing a '${name}' property`, props);
  }

  if (!validationFn(props[name])) {
    throwError(`Invalid event: '${name}: ${props[name]}' is invalid`, props);
  }
};
