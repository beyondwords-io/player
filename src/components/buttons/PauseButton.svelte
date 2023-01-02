<script>
  import Pause from "../svg_icons/Pause.svelte";

  export let scale = 1;
</script>

<div class="pause-button">
  <Pause scale={scale} />
</div>

<style>
  .pause-button {
    display: flex;
    cursor: pointer;
    position: relative;
  }
</style>
