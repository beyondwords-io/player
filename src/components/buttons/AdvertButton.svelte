<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";

  export let href;
  export let scale = 1;
</script>

<a class="advert-button" href={href} target="_blank" rel="noreferrer">
  <OpenNewTab color="#00cdbc" scale={scale} />
</a>

<style>
  .advert-button {
    display: flex;
  }
</style>
