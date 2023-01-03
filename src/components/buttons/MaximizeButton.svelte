<script>
  import Maximize from "../svg_icons/Maximize.svelte";

  export let scale = 1;
</script>

<div class="maximize-button">
  <Maximize scale={scale} />
</div>

<style>
  .maximize-button {
    display: flex;
    cursor: pointer;
  }
</style>
