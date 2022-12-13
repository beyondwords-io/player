<script>
  import Up from "./icons/Up.svelte";
  import Down from "./icons/Down.svelte";

  import SeekBack from "./icons/SeekBack.svelte";
  import SeekAhead from "./icons/SeekAhead.svelte";

  import PrevTrack from "./icons/PrevTrack.svelte";
  import NextTrack from "./icons/NextTrack.svelte";

  export let style = "segments";
  $: seconds = style.split("-")[1] || 10;
</script>

<div class="skip-buttons">
  <div class="backwards">
    {#if style === "segments"}
      <Up />
    {:else if style.startsWith("seconds")}
      <SeekBack seconds={seconds} />
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
    {:else if style.startsWith("seconds")}
      <SeekAhead seconds={seconds} />
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
    cursor: pointer;
  }

  .spacer {
    width: .5rem;
  }
</style>
