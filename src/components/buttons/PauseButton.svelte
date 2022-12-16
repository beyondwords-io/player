<script>
  import Pause from "../svg_icons/Pause.svelte";

  export let scale = 1;
</script>

<div>
  <Pause scale={scale} />
</div>

<style>
  div {
    display: flex;
    cursor: pointer;
  }
</style>
