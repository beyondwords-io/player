<script>
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";

  export let rates = [];
  export let rate = 1;
  export let color = "#212121";
  export let hoverBackground = "rgba(0, 0, 0, 0.05)";
  export let pressedBackground = "rgba(0, 0, 0, 0.1)";
  export let focusColor = "#212121";
  export let radius = "6px";
  export let onEvent = () => {};

  $: minRate = rates.length === 0 ? 0 : Math.min(...rates);
  $: maxRate = rates.length === 0 ? 1 : Math.max(...rates);

  // Speed cycles playbackRates on tap.
  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedChangeRate",
      description: "The change playback rate button was pressed.",
      initiatedBy: "user",
    }));
  };

  const handleKeyDown = (event) => {
    let key;

    if (event.key === "ArrowLeft")  { key = "Left"; }
    if (event.key === "ArrowRight") { key = "Right"; }
    if (event.key === "ArrowDown")  { key = "Down"; }
    if (event.key === "ArrowUp")    { key = "Up"; }
    if (event.key === " ")          { key = "Space"; }
    if (event.key === "Enter")      { key = "Enter"; }

    if (!key) { return; }
    event.preventDefault();

    onEvent(newEvent({
      type: `Pressed${key}OnChangeRate`,
      description: `The ${key.toLowerCase()} key was pressed while change playback rate was focussed.`,
      initiatedBy: "user",
    }));
  };
</script>

<div
  tabindex="0"
  role="spinbutton"
  class="speed-button"
  style="--hover-bg: {hoverBackground}; --pressed-bg: {pressedBackground}; border-radius: {radius}; outline-color: {focusColor}"
  on:click={handleClick}
  on:mouseup={blurElement}
  on:keydown={handleKeyDown}
  aria-label={translate("changePlaybackRate")}
  aria-valuetext={`${rate}x`}
  aria-valuenow={rate}
  aria-valuemin={minRate}
  aria-valuemax={maxRate}
>
  <span style="color: {color}">{rate}&times;</span>
</div>

<style>
  .speed-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 4px 6px;
    margin: 0;
    background: none;
    border: none;
    cursor: pointer;
  }

  /* Keeps the 44px touch floor without changing the visual size. */
  .speed-button::before {
    content: "";
    position: absolute;
    inset: -8px;
  }

  .speed-button:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .speed-button:hover {
      background: var(--hover-bg);
    }
  }

  .speed-button:active {
    background: var(--pressed-bg);
  }

  .speed-button span {
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
  }
</style>
