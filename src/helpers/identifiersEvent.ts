import newEvent from "./newEvent";

const identifiersEvent = () => (
  newEvent({
    type: "IdentifiersChanged",
    description: "The Player's content identifiers changed.",
    initiatedBy: "browser",
  })
);

export default identifiersEvent;
