<script>
  import Maximize from "../svg_icons/Maximize.svelte";

  export let scale = 1;
  export let color = "#323232";
</script>

<div class="maximize-button">
  <Maximize {scale} {color} />
</div>

<style>
  .maximize-button {
    display: flex;
    cursor: pointer;
  }
</style>
