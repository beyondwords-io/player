<script>
  import SeekBack from "../svg_icons/SeekBack.svelte";
  import PrevSegment from "../svg_icons/PrevSegment.svelte";
  import PrevTrack from "../svg_icons/PrevTrack.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";

  export let style = "segments";
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};
  let ariaLabel;

  $: backwardsSeconds = style.split("-")[1] || 10;

  $: isSegments = style === "segments";
  $: isSeconds = style.startsWith("seconds");
  $: isTracks = style === "tracks";

  $: {
    if (isSeconds) {
      ariaLabel = translate("seekBack");
    } else if (isSegments) {
      ariaLabel = translate("previousSegment");
    } else if (isTracks) {
      ariaLabel = translate("previousTrack");
    }
  }

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

<button type="button" class="prev-button" on:click={handleClick} on:mouseup={blurElement} aria-label={ariaLabel}>
  {#if isSeconds}
    <SeekBack seconds={backwardsSeconds} {scale} {color} />
  {:else if isSegments}
    <PrevSegment {scale} {color} />
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

  @media (hover: hover) and (pointer: fine) {
    .prev-button:hover :global(svg) {
      opacity: 0.8;
    }
  }
</style>
