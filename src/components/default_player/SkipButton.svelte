<script>
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";
  import PreviousSegment from "../svg_icons/default_player/PreviousSegment.svelte";
  import NextSegment from "../svg_icons/default_player/NextSegment.svelte";
  import PreviousTrack from "../svg_icons/default_player/PreviousTrack.svelte";
  import NextTrack from "../svg_icons/default_player/NextTrack.svelte";
  import SeekBack10 from "../svg_icons/default_player/SeekBack10.svelte";
  import SeekBack15 from "../svg_icons/default_player/SeekBack15.svelte";
  import SeekBack30 from "../svg_icons/default_player/SeekBack30.svelte";
  import SeekForward10 from "../svg_icons/default_player/SeekForward10.svelte";
  import SeekForward15 from "../svg_icons/default_player/SeekForward15.svelte";
  import SeekForward30 from "../svg_icons/default_player/SeekForward30.svelte";

  export let direction = "next";
  export let style = "segments";
  export let color = "#212121";
  export let hoverBackground = "rgba(0, 0, 0, 0.05)";
  export let pressedBackground = "rgba(0, 0, 0, 0.1)";
  export let focusColor = "#212121";
  export let radius = "6px";
  export let onEvent = () => {};

  const SEEK_ICONS = {
    prev: { 10: SeekBack10, 15: SeekBack15, 30: SeekBack30 },
    next: { 10: SeekForward10, 15: SeekForward15, 30: SeekForward30 },
  };

  $: isPrev = direction === "prev";
  $: isSegments = style === "segments";
  $: isSeconds = style.startsWith("seconds");
  $: isTracks = style === "tracks";

  $: backwardsSeconds = parseFloat(style.split("-")[1] || 10);
  $: forwardsSeconds = parseFloat(style.split("-")[2] || backwardsSeconds);
  $: seconds = isPrev ? backwardsSeconds : forwardsSeconds;

  // The icon family draws 10/15/30 numerals; other configured values seek
  // correctly but borrow the nearest glyph.
  $: seekIcon = SEEK_ICONS[isPrev ? "prev" : "next"][
    [10, 15, 30].reduce((a, b) => Math.abs(b - seconds) < Math.abs(a - seconds) ? b : a)
  ];

  $: ariaLabel = isSeconds
    ? translate(isPrev ? "seekBack" : "seekAhead")
    : isSegments
      ? translate(isPrev ? "previousSegment" : "nextSegment")
      : translate(isPrev ? "previousTrack" : "nextTrack");

  const handleClick = () => {
    let type, description, props;

    if (isSegments) {
      type = isPrev ? "PressedPrevSegment" : "PressedNextSegment";
      description = `The ${isPrev ? "previous" : "next"} segment button was pressed.`;
    } else if (isSeconds) {
      type = isPrev ? "PressedSeekBack" : "PressedSeekAhead";
      description = `The seek ${isPrev ? "backward" : "ahead"} button was pressed.`;
      props = { seconds };
    } else if (isTracks) {
      type = isPrev ? "PressedPrevTrack" : "PressedNextTrack";
      description = `The ${isPrev ? "previous" : "next"} track button was pressed.`;
    }

    onEvent(newEvent({ type, description, initiatedBy: "user", ...props }));
  };
</script>

<button
  type="button"
  class="skip-button"
  style="--hover-bg: {hoverBackground}; --pressed-bg: {pressedBackground}; border-radius: {radius}; outline-color: {focusColor}"
  on:click={handleClick}
  on:mouseup={blurElement}
  aria-label={ariaLabel}
>
  {#if isSeconds}
    <svelte:component this={seekIcon} size={24} {color} />
  {:else if isTracks}
    {#if isPrev}<PreviousTrack size={24} {color} />{:else}<NextTrack size={24} {color} />{/if}
  {:else}
    {#if isPrev}<PreviousSegment size={24} {color} />{:else}<NextSegment size={24} {color} />{/if}
  {/if}
</button>

<style>
  .skip-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    padding: 2px;
    margin: 0;
    background: none;
    border: none;
    cursor: pointer;
  }

  /* Keeps the 44px touch floor without changing the visual size. */
  .skip-button::before {
    content: "";
    position: absolute;
    inset: -8px;
  }

  .skip-button:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .skip-button:hover {
      background: var(--hover-bg);
    }
  }

  .skip-button:active {
    background: var(--pressed-bg);
  }
</style>
