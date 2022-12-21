<script>
  import Play from "../svg_icons/Play.svelte";

  export let scale = 1;
</script>

<div class="play-button">
  <Play scale={scale} />
</div>

<style>
  .play-button {
    display: flex;
    cursor: pointer;
  }
</style>
