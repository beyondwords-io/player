<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";

  export let href;
  export let scale = 1;
  export let interfaceStyle;
  export let controlsOrder;
</script>

<a class="advert-button {interfaceStyle} {controlsOrder}" href={href} target="_blank" rel="noreferrer">
  <OpenNewTab color={interfaceStyle === "video" ? "rgba(250, 250, 250, 0.8)" : "#00cdbc"} {scale} />
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
</style>
