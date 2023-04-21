<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";
  import newEvent from "../../helpers/newEvent";

  export let href;
  export let scale = 1;
  export let color = "#323232";
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

{#if href}
  <a class="advert-button {playerStyle} {controlsOrder}" href={href} target="_blank" on:click={handleClick}>
    <OpenNewTab {color} {scale} />
  </a>
{:else}
  <div></div>
{/if}

<style>
  .advert-button {
    display: flex;
  }

  .screen {
    position: absolute;
    bottom: 40px;
  }

  .video {
    margin-left: auto;
  }

  @media (hover: hover) and (pointer: fine) {
    .advert-button:hover :global(svg) {
      opacity: 0.8;
    }
  }
</style>
