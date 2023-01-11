<script>
  import UpArrow from "../svg_icons/UpArrow.svelte";

  export let scale = 1;
  export let color = "#323232";
</script>

<div class="scroll-to-video-button">
  <UpArrow {scale} {color} />
</div>

<style>
  .scroll-to-video-button {
    display: flex;
    cursor: pointer;
  }
</style>
