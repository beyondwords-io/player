<script>
  import UpArrow from "../svg_icons/UpArrow.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";

  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedScrollToPlayer",
      description: "The scroll to player button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<button class="scroll-to-player-button" on:click={handleClick} on:mouseup={blurElement}>
  <UpArrow {scale} {color} />
</button>

<style>
  .scroll-to-player-button {
    display: flex;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }
</style>
