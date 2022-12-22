<script>
  import Down from "../svg_icons/Down.svelte";
  import SeekAhead from "../svg_icons/SeekAhead.svelte";
  import NextTrack from "../svg_icons/NextTrack.svelte";

  export let style = "segments";
  export let scale = 1;

  $: backwardsSeconds = style.split("-")[1] || 10;
  $: forwardsSeconds = style.split("-")[2] || backwardsSeconds;
</script>

<div class="next-button">
  {#if style === "segments"}
    <Down {scale} />
  {:else if style.startsWith("seconds")}
    <SeekAhead seconds={forwardsSeconds} {scale} />
  {:else if style === "tracks"}
    <NextTrack {scale} />
  {/if}
</div>

<style>
  .next-button {
    display: flex;
    cursor: pointer;
  }
</style>
