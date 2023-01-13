<script>
  import Pause from "../svg_icons/Pause.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";

  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedPause",
      description: "The pause button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<button class="pause-button" on:click={handleClick} on:mouseup={blurElement}>
  <Pause {scale} {color} />
</button>

<style>
  .pause-button {
    display: flex;
    cursor: pointer;
    position: relative;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }
</style>
