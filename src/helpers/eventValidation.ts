import throwError from "./throwError";
import { validate as isValidUuid } from "uuid";

const initiators = ["user", "media", "browser", "media-session-api", "google-ima-sdk"];
const emitters = ["inline-player", "bottom-widget", "segment", "segment-widget"];
const postStatuses = ["handled", "ignored-due-to-advert", "ignored-due-to-scrubbing", "ignored-due-to-precedence"];
const analyticsTypes = ["load", "play", "play_progress", "ad_link_click"];
const deviceTypes = ["phone", "tablet", "desktop", "ios", "android"];
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
  validateProperty(props, "emittedFrom", s => emitters.includes(s));
  validateProperty(props, "id",          s => isValidUuid(s));
  validateProperty(props, "createdAt",   s => isIsoDateString(s));
  validateProperty(props, "status",      s => s === "pending");
};

export const validateEventAfterProcessing = (props) => {
  validateProperty(props, "type",         s => isTitleCase(s));
  validateProperty(props, "description",  s => s.length > 0);
  validateProperty(props, "initiatedBy",  s => initiators.includes(s));
  validateProperty(props, "emittedFrom",  s => emitters.includes(s));
  validateProperty(props, "id",           s => isValidUuid(s));
  validateProperty(props, "createdAt",    s => isIsoDateString(s));
  validateProperty(props, "status",       s => postStatuses.includes(s));
  validateProperty(props, "changedProps", o => typeof o === "object");
  validateProperty(props, "processedAt",  s => isIsoDateString(s));
};

export const validateAnalyticsEvent = (props) => {                                   // ClickHouse Types:
  validateProperty(props, "event_type",            s => analyticsTypes.includes(s)); // Enum
  validateProperty(props, "device_type",           s => deviceTypes.includes(s));    // Enum
  validateProperty(props, "media_type",            s => mediaTypes.includes(s));     // Enum
  validateProperty(props, "content_id",            s => !s || isValidUuid(s));       // String
  validateProperty(props, "project_id",            n => !n || n > 0);                // Int64
  validateProperty(props, "analytics_id",          n => !n || n > 0);                // Int64
  validateProperty(props, "ad_id",                 n => !n || n > 0);                // Int64
  validateProperty(props, "media_id",              n => !n || n > 0);                // Int64
  validateProperty(props, "local_storage_id",      s => !s || isValidUuid(s));       // String
  validateProperty(props, "listen_session_id",     s => !s || isValidUuid(s));       // UUID
  validateProperty(props, "session_created_at",    n => n >= 0);                     // DateTime
  validateProperty(props, "duration",              n => n >= 0);                     // Int32
  validateProperty(props, "listen_length_percent", n => n >= 0 && n <= 100);         // Int32
  validateProperty(props, "listen_length_seconds", n => n >= 0);                     // Int32
  validateProperty(props, "speed",                 n => n >= 0);                     // Int32
  validateProperty(props, "location",              s => s.length > 0);               // Not currently stored
  validateProperty(props, "referrer",              s => typeof s === "string");      // Not currently stored
  validateProperty(props, "player_version",        s => s.length > 0);               // Not currently stored
  validateProperty(props, "player_npm_version",    s => s.length > 0);               // Not currently stored
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
