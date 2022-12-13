<script>
  import Up from "./icons/Up.svelte";
  import Down from "./icons/Down.svelte";

  import SeekBack from "./icons/SeekBack.svelte";
  import SeekAhead from "./icons/SeekAhead.svelte";

  import PrevTrack from "./icons/PrevTrack.svelte";
  import NextTrack from "./icons/NextTrack.svelte";

  export let style = "segments";
</script>

<div class="skip-buttons">
  <div class="backwards">
    {#if style === "segments"}
      <Up />
    {:else if style === "seconds"}
      <SeekBack />
    {:else if style === "tracks"}
      <PrevTrack />
    {/if}
  </div>

  <slot>
    <div class="spacer"></div>
  </slot>

  <div class="forwards">
    {#if style === "segments"}
      <Down />
    {:else if style === "seconds"}
      <SeekAhead />
    {:else if style === "tracks"}
      <NextTrack />
    {/if}
  </div>
</div>

<style>
  .skip-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .backwards, .forwards {
    display: flex;
  }

  .spacer {
    width: .5rem;
  }
</style>
