<script>
  import newEvent from "../../helpers/newEvent";

  export let progress = 0;
  export let fullWidth = false;
  export let onEvent = () => {};

  const handleMousedown = (event) => {
    const clickedX = event.offsetX;
    const barWidth = event.target.clientWidth;

    const unclamped = clickedX / barWidth;
    const ratio = Math.max(0, Math.min(1, unclamped));

    onEvent(newEvent({
      type: "PressedProgressBar",
      description: "The progress bar was pressed at some ratio.",
      initiatedBy: "user",
      ratio,
    }));
  };

  const handleKeydown = (event) => {
    let key;

    if (event.key === "ArrowLeft")  { key = "Left"; }
    if (event.key === "ArrowRight") { key = "Right"; }
    if (event.key === " ")          { key = "Space"; }
    if (event.key === "Enter")      { key = "Enter"; }

    if (!key) { return; }
    event.preventDefault();

    onEvent(newEvent({
      type: `Pressed${key}OnProgressBar`,
      description: `The ${key.toLowerCase()} key was pressed while the progress bar was focussed.`,
      initiatedBy: "user",
    }));
  };
</script>

<button class="progress-bar" class:full-width={fullWidth} on:mousedown={handleMousedown} on:keydown={handleKeydown}>
  <div class="progress" style="width: {progress * 100}%"></div>
</button>

<style>
  .progress-bar {
    flex-grow: 1;
    height: 0.5rem;
    border-radius: 0.25rem;
    display: flex;
    cursor: pointer;
    overflow: hidden;

    background: #d9d9d9;
    border: none;
    margin: 0;
    padding: 0;
  }

  .progress {
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #323232;
    pointer-events: none;
  }

  .full-width {
    position: absolute;
    width: 100%;
    left: 0;
    right: 0;
    top: -0.5rem;
    border-radius: 0;
  }

  .full-width .progress {
    border-radius: 0;
    background: linear-gradient(to right, #943bfc, #fc3a41);
  }
</style>
