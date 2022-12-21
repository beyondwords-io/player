<script>
  import Up from "../svg_icons/Up.svelte";
  import Down from "../svg_icons/Down.svelte";

  import SeekBack from "../svg_icons/SeekBack.svelte";
  import SeekAhead from "../svg_icons/SeekAhead.svelte";

  import PrevTrack from "../svg_icons/PrevTrack.svelte";
  import NextTrack from "../svg_icons/NextTrack.svelte";

  export let style = "segments";
  export let scale = 1;

  $: backwardsSeconds = style.split("-")[1] || 10;
  $: forwardsSeconds = style.split("-")[2] || backwardsSeconds;
</script>

<div class="skip-buttons">
  <div class="backwards">
    {#if style === "segments"}
      <Up {scale} />
    {:else if style.startsWith("seconds")}
      <SeekBack seconds={backwardsSeconds} {scale} />
    {:else if style === "tracks"}
      <PrevTrack {scale} />
    {/if}
  </div>

  <slot>
    <div class="spacer"></div>
  </slot>

  <div class="forwards">
    {#if style === "segments"}
      <Down {scale} />
    {:else if style.startsWith("seconds")}
      <SeekAhead seconds={forwardsSeconds} {scale} />
    {:else if style === "tracks"}
      <NextTrack {scale} />
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
