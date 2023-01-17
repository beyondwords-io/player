import { validatePartialEvent } from "./validateEvent";
import { v4 as randomUuid } from "uuid";

const newEvent = (props) => {
  validatePartialEvent(props);

  const id = randomUuid();
  const createdAt = new Date().toISOString();
  const status = "pending"

  return { id, createdAt, status, ...props };
};

export default newEvent;
