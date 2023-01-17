<script>
  import Maximize from "../svg_icons/Maximize.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";

  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedMaximize",
      description: "The maximize button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<button class="maximize-button" on:click={handleClick} on:mouseup={blurElement} style="outline-offset: {0.4 * scale}rem">
  <Maximize {scale} {color} />
</button>

<style>
  .maximize-button {
    display: flex;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }
</style>
