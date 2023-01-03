<script>
  import Down from "../svg_icons/Down.svelte";
  import SeekAhead from "../svg_icons/SeekAhead.svelte";
  import NextTrack from "../svg_icons/NextTrack.svelte";

  export let style = "segments";
  export let scale = 1;
  export let color = "#323232";

  $: backwardsSeconds = style.split("-")[1] || 10;
  $: forwardsSeconds = style.split("-")[2] || backwardsSeconds;
</script>

<div class="next-button">
  {#if style === "segments"}
    <Down {scale} {color} />
  {:else if style.startsWith("seconds")}
    <SeekAhead seconds={forwardsSeconds} {scale} {color} />
  {:else if style === "tracks"}
    <NextTrack {scale} {color} />
  {/if}
</div>

<style>
  .next-button {
    display: flex;
    cursor: pointer;
  }
</style>
