<script>
  import Download from "../svg_icons/Download.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";

  export let downloadFormats;
  export let contentIndex;
  export let audio;
  export let video;
  export let scale = 1;
  export let color = "#323232";
  export let padding = 0;
  export let isVisible;
  export let onEvent = () => {};

  const mediaToDownload = (downloadFormats, audio, video) => {
    for (const format of downloadFormats) {
      for (const [i, item] of (audio || []).entries()) {
        if (item.url?.endsWith(`.${format}`)) { return [i, -1]; }
      }

      for (const [i, item] of (video || []).entries()) {
        if (item.url?.endsWith(`.${format}`)) { return [-1, i]; }
      }
    }

    return [-1, -1];
  };

  let audioIndex;
  let videoIndex;

  $: [audioIndex, videoIndex] = mediaToDownload(downloadFormats, audio, video);
  $: isVisible = audioIndex !== -1 || videoIndex !== -1;

  const handleClick = (event) => {
    event.stopPropagation();

    onEvent(newEvent({
      type: "PressedDownload",
      description: "The download button next to a playlist item was pressed.",
      initiatedBy: "user",
      contentIndex,
      audioIndex,
      videoIndex
    }));
  };
</script>

{#if audioIndex !== -1 || videoIndex !== -1}
  <button type="button" class="download-button" style="outline-offset: {4.8 * scale}px; padding: {padding}px" on:click={handleClick} on:mouseup={blurElement} aria-label={translate("downloadAudio")}>
    <Download {scale} {color} />
  </button>
{/if}

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
