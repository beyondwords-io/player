<script>
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";

  export let rate = 1;
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  $: size = `${40 * scale}px`;
  $: fontSize = `${12 * scale}px`;

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

<button type="button" class="playback-rate-button" style="width: {size}; height: {size}" on:click={handleClick} on:mouseup={blurElement} on:keydown={handleKeyDown} aria-label={translate("changePlaybackRate")}>
  <span style="font-size: {fontSize}; color: {color}">{rate}x</span>
</button>

<style>
  .playback-rate-button {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }

  @media (hover: hover) and (pointer: fine) {
    .playback-rate-button:hover span {
      opacity: 0.7;
    }
  }
</style>
