<script>
  import ShowPlaylist from "../svg_icons/ShowPlaylist.svelte";
  import HidePlaylist from "../svg_icons/HidePlaylist.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";

  export let playlistShowing;
  export let playerStyle;
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedTogglePlaylist",
      description: "The toggle playlist button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<button type="button" class="playlist-button {playerStyle}" on:click={handleClick} on:mouseup={blurElement} style="outline-offset: {5 * scale}px" aria-label={translate("togglePlaylist")}>
  {#if playlistShowing}
    <HidePlaylist {scale} {color} />
  {:else}
    <ShowPlaylist {scale} {color} />
  {/if}
</button>

<style>
  .playlist-button {
    display: flex;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }

  .playlist-button.large {
    position: relative;
    left: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .playlist-button:hover {
      opacity: 0.7;
    }
  }
</style>
