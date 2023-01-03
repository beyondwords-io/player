<script>
  import Pause from "../svg_icons/Pause.svelte";

  export let scale = 1;
  export let color = "#323232";
</script>

<div class="pause-button">
  <Pause {scale} {color} />
</div>

<style>
  .pause-button {
    display: flex;
    cursor: pointer;
    position: relative;
  }
</style>
