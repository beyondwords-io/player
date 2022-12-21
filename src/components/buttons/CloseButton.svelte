<script>
  import Close from "../svg_icons/Close.svelte";

  export let scale = 1;
</script>

<div class="close-button">
  <Close scale={scale} />
</div>

<style>
  .close-button {
    display: flex;
    cursor: pointer;
  }
</style>
