<script>
  import Download from "../svg_icons/Download.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";

  export let contentIndex;
  export let mediaIndex;
  export let scale = 1;
  export let color = "#323232";
  export let media = [];
  export let onEvent = () => {};

  const handleClick = (event) => {
    event.stopPropagation();

    onEvent(newEvent({
      type: "PressedDownload",
      description: "The download button was pressed.",
      initiatedBy: "user",
      contentIndex,
      mediaIndex,
    }));
  };
</script>

<button type="button" class="download-button" style="outline-offset: {4.8 * scale}px" on:click={handleClick} on:mouseup={blurElement} aria-label={translate("downloadAudio")}>
  <Download {scale} {color} />
</button>

<style>
  .download-button {
    display: flex;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }

  @media (hover: hover) and (pointer: fine) {
    .download-button:hover {
      opacity: 0.8;
    }
  }
</style>
