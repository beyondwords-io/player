<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";
  import newEvent from "../../helpers/newEvent";
  import translate from "../../helpers/translate";
  import ensureProtocol from "../../helpers/ensureProtocol";
  import blurElement from "../../helpers/blurElement";

  export let href;
  export let scale = 1;
  export let color = "#323232";
  export let playerStyle;
  export let controlsOrder;
  export let onEvent = () => {};

  $: hrefWithProtocol = ensureProtocol(href);

  const handleClick = () => {
    if (!hrefWithProtocol) { return; }

    onEvent(newEvent({
      type: "PressedAdvertButton",
      description: "The advert button was pressed to open the click-through URL in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

{#if hrefWithProtocol}
  <a class="advert-button {playerStyle} {controlsOrder}" href={hrefWithProtocol} target="_blank" on:click={handleClick} style="outline-offset: {3.2 * scale}px" on:mouseup={blurElement} aria-label={translate("visitAdvert")}>
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
