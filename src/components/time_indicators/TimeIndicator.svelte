<script>
  import CountdownTime from "./CountdownTime.svelte";
  import DurationInMins from "./DurationInMins.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";

  export let duration = 0;
  export let playbackTime = 0;
  $: remaining = Math.max(0, duration - playbackTime);

  export let activeStyle;
  export let positionClasses;
  export let isMobile;
  export let isAdvert;
  export let isStopped;
  export let collapsed;
  export let color = "323232";

  $: isScreen = activeStyle === "screen";
  $: scale = isScreen && !isMobile ? 3 : isScreen ? 2 : 1;
  $: opacityCss = collapsed ? "opacity: 0" : "";
</script>

<div class="time-indicator {activeStyle} {positionClasses}" class:mobile={isMobile} class:advert={isAdvert} class:stopped={isStopped} style={opacityCss}>
  <div class="inner">
    {#if isAdvert}
      <CountdownTime text="Ad" remaining={remaining} {scale} {color} />
    {:else if isStopped}
      <DurationInMins {duration} {scale} {color} />
    {:else}
      <PlaybackTime {duration} {playbackTime} {scale} {color} />
    {/if}
  </div>
</div>

<style>
  .time-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.25s;
  }

  /* When next to skip buttons */
  .standard:nth-child(5),
  .video:nth-child(5) {
    margin-left: 0.5rem;
  }

  .standard.mobile:nth-child(5) {
    margin-left: 0;
  }

  .inner {
    display: flex;
    white-space: nowrap;
  }

  .mobile {
    flex-grow: 1;
  }

  .large {
    height: 2.5rem;
    position: relative;
  }

  .large.stopped,
  .large.advert {
    flex-grow: 0;
    margin-left: -0.5rem;
  }

  .standard.advert {
    justify-content: flex-end;
  }

  .standard.fixed-left.advert {
    justify-content: flex-start;
  }

  .stopped .inner {
    position: absolute;
    left: 3.25rem;
    top: 1.75rem;
  }

  .small.stopped.mobile .inner,
  .standard.stopped.mobile .inner {
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

  .large.mobile {
    position: absolute;
    left: 6rem;
    top: 3.875rem;
    margin-left: 0;
  }

  .large.mobile .inner {
    position: static;
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
    bottom: 12.25rem;
    display: flex;
  }

  .screen.mobile {
    position: absolute;
    bottom: 8rem;
    display: flex;
  }

  .screen .inner {
    position: static;
  }

  .video.advert {
    flex-grow: 0;
  }

  .video.mobile {
    justify-content: flex-start;
  }

  .video.stopped {
    display: none;
  }
</style>
