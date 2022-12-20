<script>
  import CountdownTime from "./CountdownTime.svelte";
  import DurationInMins from "./DurationInMins.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";

  export let duration = 0;
  export let currentTime = 0;
  $: remaining = Math.max(0, duration - currentTime);

  export let interfaceStyle;
  export let position;

  export let isMobile;
  export let isAdvert;
  export let isStopped;
</script>

<div class="time-indicator {interfaceStyle} {position}" class:mobile={isMobile} class:advert={isAdvert} class:stopped={isStopped}>
  <div class="inner">
    {#if isAdvert}
      <CountdownTime text="Ad" remaining={remaining} />
    {:else if isStopped}
      <DurationInMins {duration} />
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
    position: relative;
  }

  .stopped,
  .podcast.advert {
    flex-grow: 0;
    margin-left: -0.5rem !important;
  }

  .podcast.mobile {
    position: static;
  }

  .inner {
    display: flex;
    white-space: nowrap;
  }

  .stopped .inner {
    position: absolute;
    left: 3.25rem;
    top: 1.75rem;
  }

  .stopped.mobile .inner {
    position: absolute;
    left: 2.5rem;
    top: 1.75rem;
  }

  .podcast .inner {
    position: absolute;
    left: 0.5rem;
    bottom: 0;
  }

  .podcast.mobile .inner {
    position: absolute;
    left: 6rem;
    top: 4.75rem;
  }

  .icon .inner {
    position: absolute;
    left: 2.75rem;
    top: 1.5rem;
  }

  .icon.fixed-right .inner {
    position: absolute;
    left: 1rem;
    top: 1.5rem;
  }
</style>
