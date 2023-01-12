import { validatePartialEvent } from "./validateEvent";
import { v4 as randomUuid } from "uuid";

const newEvent = (props) => {
  validatePartialEvent(props);

  const id = randomUuid();
  const createdAt = new Date().toISOString();

  return { id, createdAt, ...props };
};

export default newEvent;
