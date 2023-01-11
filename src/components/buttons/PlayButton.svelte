<script>
  import Play from "../svg_icons/Play.svelte";
  import newEvent from "../../helpers/newEvent";

  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedPlay",
      description: "The play button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<button class="play-button" on:click={handleClick}>
  <Play {scale} {color} />
</button>

<style>
  .play-button {
    display: flex;
    cursor: pointer;
    position: relative;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }
</style>
