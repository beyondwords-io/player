import throwError from "./throwError";

const initiators = ["user", "media", "browser", "google-ima-sdk"];
const postStatuses = ["handled", "ignored-due-to-advert", "ignored-due-to-scrubbing"];

export const validateEventBeforeCreation = (props) => {
  validateProperty(props, "type",        s => s.length > 0);
  validateProperty(props, "description", s => s.length > 0);
  validateProperty(props, "initiatedBy", s => initiators.includes(s));
};

export const validateEventBeforeProcessing = (props) => {
  validateProperty(props, "type",        s => s.length > 0);
  validateProperty(props, "description", s => s.length > 0);
  validateProperty(props, "initiatedBy", s => initiators.includes(s));
  validateProperty(props, "id",          s => s.length > 0);
  validateProperty(props, "createdAt",   s => s.length > 0);
  validateProperty(props, "status",      s => s === "pending");
  validateProperty(props, "fromWidget",  b => [true, false].includes(b));
};

export const validateEventAfterProcessing = (props) => {
  validateProperty(props, "type",        s => s.length > 0);
  validateProperty(props, "description", s => s.length > 0);
  validateProperty(props, "initiatedBy", s => initiators.includes(s));
  validateProperty(props, "id",          s => s.length > 0);
  validateProperty(props, "createdAt",   s => s.length > 0);
  validateProperty(props, "status",      s => postStatuses.includes(s));
  validateProperty(props, "fromWidget",  b => [true, false].includes(b));
  validateProperty(props, "processedAt", s => s.length > 0);
};

const validateProperty = (props, name, validationFn) => {
  if (!Object.prototype.hasOwnProperty.call(props, name)) {
    throwError(`Invalid event: missing a '${name}' property`, props);
  }

  if (!validationFn(props[name])) {
    throwError(`Invalid event: '${name}: ${props[name]}' is invalid`, props);
  }
};
