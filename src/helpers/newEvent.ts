import { validateEventBeforeCreation } from "./eventValidation";
import { v4 as randomUuid } from "uuid";

const newEvent = (props) => {
  validateEventBeforeCreation(props);

  const id = randomUuid();
  const createdAt = new Date().toISOString();
  const status = "pending";

  return { id, createdAt, status, ...props };
};

export default newEvent;
