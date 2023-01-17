import newEvent from "../../helpers/newEvent";

const handleKeyDown = (onEvent, kind) => (event) => {
  let key;

  if (event.key === "ArrowLeft")  { key = "Left"; }
  if (event.key === "ArrowRight") { key = "Right"; }
  if (event.key === " ")          { key = "Space"; }
  if (event.key === "Enter")      { key = "Enter"; }

  if (!key) { return; }
  event.preventDefault();

  onEvent(newEvent({
    type: `Pressed${key}OnProgress${kind}`,
    description: `The ${key.toLowerCase()} key was pressed while the progress ${kind.toLowerCase()} was focussed.`,
    initiatedBy: "user",
  }));
};

export default handleKeyDown;
