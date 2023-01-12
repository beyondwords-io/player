import throwError from "./throwError";

const validatePartialEvent = (props) => {
  validateProperty(props, "type");
  validateProperty(props, "description");
  validateProperty(props, "initiatedBy");
};

const validateEvent = (props) => {
  validatePartialEvent(props);

  validateProperty(props, "id");
  validateProperty(props, "createdAt");
  validateProperty(props, "fromWidget");
};

const validateProperty = (props, name) => {
  if (!props.hasOwnProperty(name)) {
    throwError(`Invalid event: missing a '${name}' property`, props);
  }
};

export { validatePartialEvent };
export default validateEvent;
