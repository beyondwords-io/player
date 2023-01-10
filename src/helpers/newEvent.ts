import { v4 as randomUuid } from "uuid";
import throwError from "./throwError";

const newEvent = ({ type, description, initiatedBy, ...props }) => {
  if (!type)        { throwError("newEvent was called without a type"); }
  if (!description) { throwError("newEvent was called without a description"); }
  if (!initiatedBy) { throwError("newEvent was called without initiatedBy"); }

  const id = randomUuid();
  const createdAt = new Date().toISOString();

  return { id, type, description, initiatedBy, createdAt, ...props };
};

export default newEvent;
