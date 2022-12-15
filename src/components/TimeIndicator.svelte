<script>
  import CountdownTime from "./CountdownTime.svelte";
  import Duration from "./Duration.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";

  export let text = "Ad";
  export let duration = 0;
  export let currentTime = 0;
  $: remaining = Math.max(0, duration - currentTime);

  export let isMobile;
  export let isAdvert;
  export let isPodcast;
  export let isStopped;
</script>

<div class="time-indicator" class:mobile={isMobile} class:advert={isAdvert} class:podcast={isPodcast}>
  <div class="inner">
    {#if isAdvert}
      <CountdownTime {text} remaining={remaining} />
    {:else if isStopped}
      <Duration {duration} />
    {:else}
      <PlaybackTime {duration} {currentTime} />
    {/if}
  </div>
</div>

<style>
  .time-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .advert {
    justify-content: flex-end;
  }

  /* When next to skip buttons */
  .time-indicator:nth-child(4) {
    margin-left: 0.5rem;
  }

  .mobile {
    flex-grow: 1;
    margin-left: 0 !important;
  }

  .podcast {
    height: 2.5rem;
    margin-left: 0 !important;
    margin-right: -0.5rem;
    position: relative;
  }

  .mobile.podcast {
    position: static;
  }

  .inner {
    display: flex;
    white-space: nowrap;
  }

  .podcast .inner {
    position: absolute;
    left: 0;
    bottom: 0;
  }

  .mobile.podcast .inner {
    left: 6rem;
    top: 4.75rem;
  }
</style>
