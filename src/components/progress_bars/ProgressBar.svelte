<script>
  import { onMount } from "svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import handleKeyDown from "./handleKeyDown";

  export let progress = 0;
  export let fullWidth = false;
  export let color = "#323232";
  export let onEvent = () => {};

  $: backgroundStyle = fullWidth ? "" : `background: ${color}`;

  let progressBar;
  let mouseDown;

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
    const { x, width } = progressBar.getBoundingClientRect();
    const mouseRatio = (event.clientX - x) / width;

    return Math.max(0, Math.min(1, mouseRatio));
  };

  onMount(() => {
    const listener1 = addEventListener("mouseup", handleMouseUp);
    const listener2 = addEventListener("mousemove", handleMouseMove);

    return () => {
      removeEventListener("mouseup", listener1);
      removeEventListener("mousemove", listener2);
    };
  });
</script>

<button type="button" bind:this={progressBar} class="progress-bar" class:full-width={fullWidth} on:mousedown={handleMouseDown} on:keydown={handleKeyDown(onEvent, "Bar")} on:mouseup={blurElement}>
  <div class="background" style="{backgroundStyle}"></div>
  <div class="progress" style="{backgroundStyle}; width: {progress * 100}%"></div>
</button>

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
  }

  .progress {
    height: 8px;
    border-radius: 4px;
    pointer-events: none;
  }

  .full-width {
    position: absolute;
    width: 100%;
    left: 0;
    right: 0;
    top: -8px;
    border-radius: 0;
  }

  .full-width .progress {
    border-radius: 0;
    background: linear-gradient(to right, #943bfc, #fc3a41);
  }
</style>
