<script>
  import Close from "../svg_icons/Close.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";

  export let scale = 1;
  export let color = "#323232";
  export let margin = "auto";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedCloseWidget",
      description: "The close widget button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<button type="button" class="close-widget-button" style="margin: {margin}; outline-offset: {4.8 * scale}px" on:click={handleClick} on:mouseup={blurElement} aria-label={translate("closeWidget")}>
  <Close {scale} {color} />
</button>

<style>
  .close-widget-button {
    display: flex;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }

  @media (hover: hover) and (pointer: fine) {
    .close-widget-button:hover {
      opacity: 0.8;
    }
  }
</style>
