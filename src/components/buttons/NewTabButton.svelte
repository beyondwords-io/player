<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";

  export let href;
  export let scale = 1;
  export let color = "#323232";
  export let interfaceStyle;
</script>

<a class="new-tab-button {interfaceStyle}" href={href} target="_blank" rel="noreferrer">
  <OpenNewTab {color} scale={scale} />
</a>

<style>
  .new-tab-button {
    display: flex;
  }

  .url {
    position: absolute;
    bottom: 2.5rem;
    left: 50%;
    transform: translateX(-50%);
  }
</style>
