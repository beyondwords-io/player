<script>
  import Play from "../svg_icons/Play.svelte";

  export let scale = 1;
</script>

<div>
  <Play scale={scale} />
</div>

<style>
  div {
    display: flex;
    cursor: pointer;
  }
</style>
