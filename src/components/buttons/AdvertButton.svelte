<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";

  export let href;
  export let scale = 1;
</script>

<a href={href} target="_blank" rel="noreferrer">
  <OpenNewTab color="#00cdbc" scale={scale} />
</a>

<style>
  a {
    display: flex;
  }
</style>
