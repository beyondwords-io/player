import throwError from "./throwError";

export const validatePartialEvent = (props) => {
  validateProperty(props, "type");
  validateProperty(props, "description");
  validateProperty(props, "initiatedBy");
};

export const validatePreEvent = (props) => {
  validatePartialEvent(props);

  validateProperty(props, "id");
  validateProperty(props, "createdAt");
  validateProperty(props, "status");
  validateProperty(props, "fromWidget");
};

export const validatePostEvent = (props) => {
  validatePreEvent(props);

  validateProperty(props, "processedAt");
}

const validateProperty = (props, name) => {
  if (Object.prototype.hasOwnProperty.call(props, name)) { return; }
  throwError(`Invalid event: missing a '${name}' property`, props);
};
