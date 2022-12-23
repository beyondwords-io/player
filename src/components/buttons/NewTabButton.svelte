<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";

  export let href;
  export let scale = 1;
</script>

<a class="new-tab-button" href={href} target="_blank" rel="noreferrer">
  <OpenNewTab scale={scale} circular={false} />
</a>

<style>
  .new-tab-button {
    display: flex;
  }
</style>
