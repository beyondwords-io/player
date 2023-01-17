<script>
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";

  export let speed = 1;
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  $: size = `${2.5 * scale}rem`;
  $: fontSize = `${0.75 * scale}rem`;

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

  $: style = `width: ${size}; height: ${size}; font-size: ${fontSize}; color: ${color}`;
</script>

<button class="speed-button" {style} on:click={handleClick} on:mouseup={blurElement} on:keydown={handleKeyDown}>
  {speed}x
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
</style>
