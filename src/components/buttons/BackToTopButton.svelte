<script>
  import UpArrow from "../svg_icons/UpArrow.svelte";

  export let scale = 1;
  export let color = "#323232";
</script>

<div class="back-to-top-button">
  <UpArrow {scale} {color} />
</div>

<style>
  .back-to-top-button {
    display: flex;
    cursor: pointer;
  }
</style>
