<script>
  import Close from "../svg_icons/Close.svelte";

  export let scale = 1;
  export let color = "#323232";
  export let margin = "auto";
</script>

<div class="close-button" style="margin: {margin}">
  <Close {scale} {color} />
</div>

<style>
  .close-button {
    display: flex;
    cursor: pointer;
  }
</style>
