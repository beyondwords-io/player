<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";

  export let href;
  export let scale = 1;
  export let interfaceStyle;
</script>

<a class="advert-button {interfaceStyle}" href={href} target="_blank" rel="noreferrer">
  <OpenNewTab color="#00cdbc" scale={scale} />
</a>

<style>
  .advert-button {
    display: flex;
  }

  .screen {
    position: absolute;
    top: 38.875rem;
  }
</style>
