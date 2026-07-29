<script>
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";
  import handleKeyDown from "../progress_bars/handleKeyDown";

  export let progress = 0;
  export let duration = 0;
  export let trackColor = "rgba(0, 0, 0, 0.1)";
  export let fillColor = "#212121";
  export let focusColor = "#212121";
  export let readonly = false;
  export let buffering = false;
  export let fillOpacity = 1;
  export let onEvent = () => {};

  let track;
  let readFullTime = true;

  $: seconds = Math.max(0, Math.min(progress, 1)) * duration;
  $: outOf = readFullTime ? `${translate("outOfTotalTime")} ${formatTime(duration)}` : "";
  $: ariaText = `${formatTime(seconds)} ${outOf}`;

  const handleFocus = () => readFullTime = true;
  const handleLeftOrRight = () => readFullTime = false;

  // Click-to-seek is the pointer model for the default style - no drag handle.
  const handlePointerDown = (event) => {
    if (readonly) { return; }
    const clientX = event.clientX || event.touches?.[0]?.clientX || 0;
    const { x, width } = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - x) / width));

    onEvent(newEvent({
      type: "PressedProgressBar",
      description: "The progress bar was pressed at some ratio.",
      initiatedBy: "user",
      ratio,
    }));

    onEvent(newEvent({
      type: "FinishedScrubbingProgressBar",
      description: "The user let go after scrubbing the progress bar.",
      initiatedBy: "user",
    }));
  };

  const formatTime = (n) => {
    const rounded = Math.floor(n || 0);

    if (rounded === 0) { return translate("secondsPlural").replace("{n}", 0); }

    const minutes = Math.floor(rounded / 60);
    const secs = rounded % 60;

    return [formatUnit(minutes, "minutes"), formatUnit(secs, "seconds")].filter(s => s).join(" ");
  };

  const formatUnit = (n, units) => {
    if (n === 0) { return; }
    const key = n === 1 ? `${units}Singular` : `${units}Plural`;
    return translate(key).replace("{n}", n);
  };
</script>

<div
  tabindex={readonly ? -1 : 0}
  role="slider"
  bind:this={track}
  class="progress-track"
  class:readonly
  class:buffering
  style="background: {trackColor}; outline-color: {focusColor}"
  on:mousedown={handlePointerDown}
  on:touchstart={handlePointerDown}
  on:keydown={readonly ? undefined : handleKeyDown(onEvent, "Bar", handleLeftOrRight)}
  on:mouseup={blurElement}
  on:focus={handleFocus}
  aria-label={translate("playbackTime")}
  aria-valuetext={ariaText}
  aria-valuenow={Math.floor(seconds)}
  aria-valuemin={0}
  aria-valuemax={Math.floor(duration)}
  aria-readonly={readonly || undefined}
>
  <div class="fill" style="width: {Math.max(0, Math.min(progress, 1)) * 100}%; background: {fillColor}; opacity: {fillOpacity}"></div>
</div>

<style>
  .progress-track {
    position: relative;
    height: 3px;
    border-radius: 9999px;
    cursor: pointer;
  }

  .progress-track::before {
    content: "";
    position: absolute;
    inset: -8px 0;
  }

  .progress-track:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 4px;
  }

  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    border-radius: 9999px;
    pointer-events: none;
  }

  .progress-track.readonly {
    cursor: default;
  }

  .progress-track.buffering {
    animation: shimmer 1.2s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
  }

  @media (prefers-reduced-motion: reduce) {
    .progress-track.buffering {
      animation: none;
    }
  }
</style>
