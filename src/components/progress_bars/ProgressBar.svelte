<script>
  import { onMount } from "svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";
  import handleKeyDown from "./handleKeyDown";

  export let progress = 0;
  export let duration = 0;
  export let fullWidth = false;
  export let readonly = false;
  export let color = "#323232";
  export let onEvent = () => {};

  let progressBar;
  let mouseDown;
  let updateSticky = true;
  let readFullTime = true;

  $: stickyProgress = updateSticky ? Math.max(0, Math.min(progress, 1)) : stickyProgress;
  $: stickySeconds = stickyProgress * duration;
  $: updateSticky, setTimeout(() => updateSticky = false, 0);

  const handleFocus = () => { updateSticky = true; readFullTime = true; };
  const handleLeftOrRight = () => { updateSticky = true; readFullTime = false; };

  $: outOf = readFullTime ? `${translate("outOfTotalTime")} ${formatTime(duration)}` : "";
  $: ariaText = `${formatTime(stickySeconds)} ${outOf}`;

  const handleMouseDown = (event) => {
    mouseDown = true;

    onEvent(newEvent({
      type: "PressedProgressBar",
      description: "The progress bar was pressed at some ratio.",
      initiatedBy: "user",
      ratio: getMouseRatio(event),
    }));
  };

  const handleMouseMove = (event) => {
    if (!mouseDown) { return; }
    if (!progressBar) { handleMouseUp(); return; }

    onEvent(newEvent({
      type: "ScrubbedProgressBar",
      description: "The user pressed on the progress bar then dragged.",
      initiatedBy: "user",
      ratio: getMouseRatio(event),
    }));
  };

  const handleMouseUp = () => {
    if (!mouseDown) { return; }
    mouseDown = false;

    onEvent(newEvent({
      type: "FinishedScrubbingProgressBar",
      description: "The user let go after scrubbing the progress bar.",
      initiatedBy: "user",
    }));
  };

  const getMouseRatio = (event) => {
    const clientX = event.clientX || event.touches?.[0]?.clientX || 0;

    const { x, width } = progressBar.getBoundingClientRect();
    const mouseRatio = (clientX - x) / width;

    return Math.max(0, Math.min(1, mouseRatio));
  };

  const formatTime = (n) => {
    const rounded = Math.floor(n);

    if (rounded === 0) { return translate("secondsPlural").replace("{n}", 0); }

    const minutes = Math.floor(rounded / 60);
    const seconds = rounded % 60;

    return [formatUnit(minutes, "minutes"), formatUnit(seconds, "seconds")].filter(s => s).join(" ");
  };

  const formatUnit = (n, units) => {
    if (n === 0) { return; }
    const key = n === 1 ? `${units}Singular` : `${units}Plural`;
    return translate(key).replace("{n}", n);
  };

  onMount(() => {
    const mouseup = addEventListener("mouseup", handleMouseUp);
    const mousemove = addEventListener("mousemove", handleMouseMove);
    const touchend = addEventListener("touchend", handleMouseUp);
    const touchmove = addEventListener("touchmove", handleMouseMove);

    return () => {
      removeEventListener("mouseup", mouseup);
      removeEventListener("mousemove", mousemove);
      removeEventListener("touchend", touchend);
      removeEventListener("touchmove", touchmove);
    };
  });
</script>

<div type="button" tabindex="0" role="slider" bind:this={progressBar} class="progress-bar" class:full-width={fullWidth} class:readonly class:mouse-down={mouseDown} on:mousedown={handleMouseDown} on:touchstart={handleMouseDown} on:keydown={handleKeyDown(onEvent, "Bar", handleLeftOrRight)} on:mouseup={blurElement} on:focus={handleFocus} aria-label={translate("playbackTime")} aria-valuetext={ariaText} aria-valuenow={stickySeconds} aria-valuemin={0} aria-valuemax={Math.floor(duration)}>
  <div class="background" style="background: {color}"></div>
  <div class="progress" style="background: {color}; width: {progress * 100}%"></div>
</div>

<style>
  .progress-bar {
    flex-grow: 1;
    height: 8px;
    border-radius: 4px;
    display: flex;
    cursor: pointer;
    overflow: hidden;
    outline-offset: 3.2px;

    border: none;
    margin: 0;
    padding: 0;
    position: relative;
  }

  .background {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    opacity: 0.15;
    cursor: pointer;
  }

  .readonly,
  .readonly * {
    cursor: auto;
  }

  .progress {
    height: 8px;
    border-radius: 4px;
    pointer-events: none;
  }

  .full-width {
    position: absolute;
    width: 100%;
    height: 4px;
    left: 0;
    right: 0;
    top: -4px;
    border-radius: 0;
  }

  .full-width:not(.readonly):hover,
  .full-width:not(.readonly).mouse-down {
    height: 8px;
    top: -6px;
  }

  .full-width .background {
    opacity: 0.4;
  }

  .full-width .progress {
    border-radius: 0;
    background: linear-gradient(to right, #943bfc, #fc3a41);
  }
</style>
