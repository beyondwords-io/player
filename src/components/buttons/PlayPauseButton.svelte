<script>
  import Play from "../svg_icons/Play.svelte";
  import Pause from "../svg_icons/Pause.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";

  export let isPlaying = false;
  export let tabindex = 0;
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = (event) => {
    event.preventDefault();
    const name = isPlaying ? "Pause" : "Play";

    onEvent(newEvent({
      type: `Pressed${name}`,
      description: `The ${name.toLowerCase()} button was pressed.`,
      initiatedBy: "user",
    }));
  };
</script>

<button type="button" class="play-pause-button" {tabindex} on:click={handleClick} on:mouseup={blurElement} style="outline-offset: {3.2 * scale}px">
  {#if isPlaying}
    <Pause {scale} {color} />
  {:else}
    <Play {scale} {color} />
  {/if}
</button>

<style>
  .play-pause-button {
    display: flex;
    cursor: pointer;
    position: relative;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }

  @media (hover: hover) and (pointer: fine) {
    .play-pause-button:hover {
      opacity: 0.8;
    }
  }
</style>
