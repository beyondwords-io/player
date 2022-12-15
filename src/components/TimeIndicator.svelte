<script>
  import CountdownTime from "./time_indicators/CountdownTime.svelte";
  import Duration from "./time_indicators/Duration.svelte";
  import PlaybackTime from "./time_indicators/PlaybackTime.svelte";

  export let duration = 0;
  export let currentTime = 0;
  $: remaining = Math.max(0, duration - currentTime);

  export let playerStyle;
  export let isMobile;
  export let isAdvert;
  export let isStopped;
</script>

<div class="time-indicator {playerStyle}" class:mobile={isMobile} class:advert={isAdvert} class:stopped={isStopped}>
  <div class="inner">
    {#if isAdvert}
      <CountdownTime text="Ad" remaining={remaining} />
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

  .stopped {
    flex-grow: 0;
    margin-left: -0.5rem !important;
  }

  .podcast {
    height: 2.5rem;
    margin-left: 0 !important;
    margin-right: -0.5rem;
    position: relative;
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
    left: 0;
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
</style>
