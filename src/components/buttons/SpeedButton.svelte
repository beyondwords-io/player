<script>
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";

  export let speed = 1;
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  $: size = `${40 * scale}px`;
  $: fontSize = `${12 * scale}px`;

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedChangeSpeed",
      description: "The change speed button was pressed.",
      initiatedBy: "user",
    }));
  };

  const handleKeyDown = (event) => {
    let key;

    if (event.key === "ArrowLeft")  { key = "Left"; }
    if (event.key === "ArrowRight") { key = "Right"; }
    if (event.key === "ArrowDown")  { key = "Down"; }
    if (event.key === "ArrowUp")    { key = "Up"; }
    if (event.key === " ")          { key = "Space"; }
    if (event.key === "Enter")      { key = "Enter"; }

    if (!key) { return; }
    event.preventDefault();

    onEvent(newEvent({
      type: `Pressed${key}OnChangeSpeed`,
      description: `The ${key.toLowerCase()} key was pressed while change speed was focussed.`,
      initiatedBy: "user",
    }));
  };
</script>

<button type="button" class="speed-button" style="width: {size}; height: {size}" on:click={handleClick} on:mouseup={blurElement} on:keydown={handleKeyDown}>
  <span style="font-size: {fontSize}; color: {color}">{speed}x</span>
</button>

<style>
  .speed-button {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }

  @media (hover: hover) and (pointer: fine) {
    .speed-button:hover span {
      opacity: 0.7;
    }
  }
</style>
