<script>
  import Up from "../svg_icons/Up.svelte";
  import SeekBack from "../svg_icons/SeekBack.svelte";
  import PrevTrack from "../svg_icons/PrevTrack.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";

  export let style = "segments";
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  $: backwardsSeconds = style.split("-")[1] || 10;
  $: forwardsSeconds = style.split("-")[2] || backwardsSeconds;

  $: isSegments = style === "segments";
  $: isSeconds = style.startsWith("seconds");
  $: isTracks = style === "tracks";

  const handleClick = () => {
    let type, description, props;

    if (isSegments) {
      type = "PressedPrevSegment";
      description = "The previous segment button was pressed.";
    } else if (isSeconds) {
      type = "PressedSeekBack";
      description = "The seek backward button was pressed.";
      props = { seconds: backwardsSeconds };
    } else if (isTracks) {
      type = "PressedPrevTrack";
      description = "The previous track button was pressed.";
    }

    onEvent(newEvent({ type, description, initiatedBy: "user", ...props }));
  };
</script>

<button class="prev-button" on:click={handleClick} on:mouseup={blurElement}>
  {#if isSegments}
    <Up {scale} {color} />
  {:else if isSeconds}
    <SeekBack seconds={backwardsSeconds} {scale} {color} />
  {:else if isTracks}
    <PrevTrack {scale} {color} />
  {/if}
</button>

<style>
  .prev-button {
    display: flex;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }
</style>
