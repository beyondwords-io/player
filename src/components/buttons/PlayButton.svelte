<script>
  import Play from "../svg_icons/Play.svelte";

  export let scale = 1;
  export let color = "#323232";
</script>

<div class="play-button">
  <Play {scale} {color} />
</div>

<style>
  .play-button {
    display: flex;
    cursor: pointer;
    position: relative;
  }
</style>
