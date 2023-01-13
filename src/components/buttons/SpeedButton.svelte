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
</script>

<button class="speed-button" on:click={handleClick} on:mouseup={blurElement} style="width: {size}; height: {size}; font-size: {fontSize}; color: {color}">
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
