import throwError from "./throwError";
import { validate as isValidUuid } from "uuid";

const initiators = ["user", "media", "browser", "google-ima-sdk"];
const postStatuses = ["handled", "ignored-due-to-advert", "ignored-due-to-scrubbing"];
const analyticsTypes = ["load", "play", "play_progress", "ad_link_click"];
const deviceTypes = ["desktop", "phone", "tablet", "ios", "android"];
const mediaTypes = ["podcast", "preroll"];

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

export const validateAnalyticsEvent = (props) => {                        // ClickHouse Types:
  validateProperty(props, "event_type", s => analyticsTypes.includes(s)); // Enum
  validateProperty(props, "device_type", s => deviceTypes.includes(s));   // Enum
  validateProperty(props, "media_type", s => mediaTypes.includes(s));     // Enum
  validateProperty(props, "podcast_id", s => true);                       // String
  validateProperty(props, "project_id", s => true);                       // Int64
  validateProperty(props, "publisher_id", s => true);                     // Int64
  validateProperty(props, "campaign_id", s => true);                      // Int64
  validateProperty(props, "media_id", s => true);                         // Int64
  validateProperty(props, "user_id", s => true);                          // String
  validateProperty(props, "listen_session_id", s => isValidUuid(s));      // UUID
  validateProperty(props, "created_at_date", s => true);                  // Date
  validateProperty(props, "created_at_datetime", s => true);              // DateTime
  validateProperty(props, "duration", s => true);                         // Int32
  validateProperty(props, "listen_length_percent", s => true);            // Int32
  validateProperty(props, "listen_length_seconds", s => true);            // Int32
  validateProperty(props, "listen_from_start_length_seconds", s => true); // Int32
  validateProperty(props, "speed", s => true);                            // Int32
  validateProperty(props, "location", s => s.length > 0);                 // Not currently stored
  validateProperty(props, "referrer", s => typeof s === "string");        // Not currently stored
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
