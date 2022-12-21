<script>
  import Close from "../svg_icons/Close.svelte";

  export let scale = 1;
  export let margin = "auto";
</script>

<div class="close-button" style="margin: {margin}">
  <Close scale={scale} />
</div>

<style>
  .close-button {
    display: flex;
    cursor: pointer;
  }
</style>
