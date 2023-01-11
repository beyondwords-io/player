<script>
  import UpArrow from "../svg_icons/UpArrow.svelte";
  import newEvent from "../../helpers/newEvent";

  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedScrollToVideo",
      description: "The scroll to video button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<button class="scroll-to-video-button" on:click={handleClick}>
  <UpArrow {scale} {color} />
</button>

<style>
  .scroll-to-video-button {
    display: flex;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }
</style>
