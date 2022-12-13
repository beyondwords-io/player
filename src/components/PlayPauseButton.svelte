<script>
  import Play from "./icons/Play.svelte";
  import Pause from "./icons/Pause.svelte";

  export let isPlaying = false;
</script>

<div>
  {#if isPlaying}
    <Pause />
  {:else}
    <Play />
  {/if}
</div>

<style>
  div {
    display: flex;
    cursor: pointer;
  }
</style>
