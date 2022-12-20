<script>
  import Close from "../svg_icons/Close.svelte";

  export let scale = 1;
</script>

<div>
  <Close scale={scale} />
</div>

<style>
  div {
    display: flex;
    cursor: pointer;
  }
</style>
