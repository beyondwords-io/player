<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";
  import newEvent from "../../helpers/newEvent";

  export let href;
  export let scale = 1;
  export let playerStyle;
  export let controlsOrder;
  export let onEvent = () => {};

  const handleClick = () => {
    if (!href) { return; }

    onEvent(newEvent({
      type: "PressedAdvertButton",
      description: "The advert button was pressed to open the click-through URL in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

<a class="advert-button {playerStyle} {controlsOrder}" class:hidden={!href} href={href} target="_blank" rel="noreferrer" on:click={handleClick}>
  <OpenNewTab color={playerStyle === "video" ? "rgba(250, 250, 250, 0.8)" : "#00cdbc"} {scale} />
</a>

<style>
  .advert-button {
    display: flex;
  }

  .screen {
    position: absolute;
    bottom: 2.5rem;
  }

  .video {
    margin-left: auto;
  }

  .advert-button:hover :global(svg) {
    opacity: 0.8;
  }

  .hidden :global(svg),
  .hidden:hover :global(svg) {
    opacity: 0;
  }
</style>
