<script>
  import SeekAhead from "../svg_icons/SeekAhead.svelte";
  import NextSegment from "../svg_icons/NextSegment.svelte";
  import NextTrack from "../svg_icons/NextTrack.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";

  export let style = "segments";
  export let scale = 1;
  export let color = "#323232";
  export let disabled = false;
  export let onEvent = () => {};

  $: backwardsSeconds = parseFloat(style.split("-")[1] || 10);
  $: forwardsSeconds = parseFloat(style.split("-")[2] || backwardsSeconds);

  $: isSegments = style === "segments";
  $: isSeconds = style.startsWith("seconds");
  $: isTracks = style === "tracks";

  const handleClick = () => {
    if (disabled) { return; }
    let type, description, props;

    if (isSegments) {
      type = "PressedNextSegment";
      description = "The next segment button was pressed.";
    } else if (isSeconds) {
      type = "PressedSeekAhead";
      description = "The seek ahead button was pressed.";
      props = { seconds: forwardsSeconds };
    } else if (isTracks) {
      type = "PressedNextTrack";
      description = "The next track button was pressed.";
    }

    onEvent(newEvent({ type, description, initiatedBy: "user", ...props }));
  };
</script>

<button type="button" class="next-button" on:click={handleClick} on:mouseup={blurElement}>
  {#if isSeconds}
    <SeekAhead seconds={forwardsSeconds} {scale} {color} />
  {:else if isSegments}
    <NextSegment {scale} {color} />
  {:else if isTracks}
    <NextTrack {scale} {color} />
  {/if}
</button>

<style>
  .next-button {
    display: flex;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }

  @media (hover: hover) and (pointer: fine) {
    .next-button:hover :global(svg) {
      opacity: 0.8;
    }
  }
</style>
