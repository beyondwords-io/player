<script>
  import Up from "../svg_icons/Up.svelte";
  import SeekBack from "../svg_icons/SeekBack.svelte";
  import PrevTrack from "../svg_icons/PrevTrack.svelte";

  export let style = "segments";
  export let scale = 1;
  export let color = "#323232";

  $: backwardsSeconds = style.split("-")[1] || 10;
  $: forwardsSeconds = style.split("-")[2] || backwardsSeconds;
</script>

<div class="prev-button">
  {#if style === "segments"}
    <Up {scale} {color} />
  {:else if style.startsWith("seconds")}
    <SeekBack seconds={backwardsSeconds} {scale} {color} />
  {:else if style === "tracks"}
    <PrevTrack {scale} {color} />
  {/if}
</div>

<style>
  .prev-button {
    display: flex;
    cursor: pointer;
  }
</style>
