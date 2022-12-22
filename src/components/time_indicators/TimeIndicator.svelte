<script>
  import CountdownTime from "./CountdownTime.svelte";
  import DurationInMins from "./DurationInMins.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";

  export let duration = 0;
  export let currentTime = 0;
  $: remaining = Math.max(0, duration - currentTime);

  export let interfaceStyle;
  $: scale = interfaceStyle === "screen" ? 3 : 1;

  export let position;
  export let isMobile;
  export let isAdvert;
  export let isStopped;
</script>

<div class="time-indicator {interfaceStyle} {position}" class:mobile={isMobile} class:advert={isAdvert} class:stopped={isStopped}>
  <div class="inner">
    {#if isAdvert}
      <CountdownTime text="Ad" remaining={remaining} {scale} />
    {:else if isStopped}
      <DurationInMins {duration} {scale} />
    {:else}
      <PlaybackTime {duration} {currentTime} {scale} />
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
  .time-indicator:nth-child(5) {
    margin-left: 0.5rem;
  }

  .mobile {
    flex-grow: 1;
    margin-left: 0 !important;
  }

  .large {
    height: 2.5rem;
    margin-left: 0 !important;
    position: relative;
  }

  .screen {
    margin-left: 0 !important;
  }

  .standard.stopped,
  .large.stopped,
  .large.advert {
    flex-grow: 0;
    margin-left: -0.5rem !important;
  }

  .large.mobile {
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

  .standard.stopped.fixed-right .inner {
    position: absolute;
    left: 2.25rem;
    top: 1.75rem;
  }

  .standard.stopped.fixed-left .inner {
    position: absolute;
    left: 3.25rem;
    top: 1.75rem;
  }

  .large .inner {
    position: absolute;
    left: 0.5rem;
    bottom: 0;
  }

  .large.mobile .inner {
    position: absolute;
    left: 6rem;
    top: 4.75rem;
  }

  .small .inner {
    position: absolute;
    left: 2.75rem;
    top: 1.5rem;
  }

  .small.fixed-right .inner {
    position: absolute;
    left: 1rem;
    top: 1.5rem;
  }

  .small.fixed-right.advert .inner {
    position: absolute;
    left: 2.75rem;
    top: 1.5rem;
  }

  .screen {
    position: absolute;
    top: 31.375rem;
    display: flex;
  }

  .screen .inner {
    position: static;
  }
</style>
