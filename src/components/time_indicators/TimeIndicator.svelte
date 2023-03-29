<script>
  import CountdownTime from "./CountdownTime.svelte";
  import DurationInMins from "./DurationInMins.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";

  export let duration = 0;
  export let currentTime = 0;
  $: remaining = Math.max(0, duration - currentTime);

  export let playerStyle;
  export let positionClasses;
  export let isMobile;
  export let isAdvert;
  export let isStopped;
  export let collapsed;
  export let largeImage;
  export let color = "323232";

  $: isScreen = playerStyle === "screen";
  $: scale = isScreen && !isMobile ? 3 : isScreen ? 2 : 1;
  $: opacityCss = collapsed ? "opacity: 0" : "";
  $: noTransition = !isAdvert && currentTime < 0.1;
</script>

<div class="time-indicator {playerStyle} {positionClasses}" class:mobile={isMobile} class:advert={isAdvert} class:stopped={isStopped} class:no-image={!largeImage} class:no-transition={noTransition} style={opacityCss}>
  <div class="inner">
    {#if isAdvert && currentTime === 0}
      <!-- -->
    {:else if isAdvert}
      <CountdownTime text="Ad" remaining={remaining} {scale} {color} />
    {:else if isStopped}
      <DurationInMins {duration} {scale} {color} />
    {:else}
      <PlaybackTime {duration} {currentTime} {scale} {color} />
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
    margin-left: 8px;
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
    height: 40px;
    position: relative;
  }

  .large.stopped,
  .large.advert {
    flex-grow: 0;
    margin-left: -8px;
  }

  .standard.advert {
    justify-content: flex-end;
  }

  .standard.fixed-left.advert {
    justify-content: flex-start;
  }

  .stopped .inner {
    position: absolute;
    left: 52px;
    top: 28px;
  }

  .small.stopped.mobile .inner,
  .standard.stopped.mobile .inner {
    position: absolute;
    left: 40px;
    top: 28px;
  }

  .standard.stopped.fixed-right .inner {
    position: absolute;
    left: 36px;
    top: 28px;
  }

  .standard.stopped.fixed-left .inner {
    position: absolute;
    left: 52px;
    top: 28px;
  }

  .large .inner {
    position: absolute;
    left: 8px;
    bottom: 0;
  }

  .large.mobile {
    position: absolute;
    left: 96px;
    top: 62px;
    margin-left: 0;
  }

  .large.mobile.no-image {
    left: auto;
  }

  .large.mobile .inner {
    position: static;
  }

  .small .inner {
    position: absolute;
    left: 44px;
    top: 24px;
  }

  .small.fixed-right .inner {
    position: absolute;
    left: 16px;
    top: 24px;
  }

  .small.fixed-right.advert .inner {
    position: absolute;
    left: 44px;
    top: 24px;
  }

  .screen {
    position: absolute;
    bottom: 196px;
    display: flex;
  }

  .screen.mobile {
    position: absolute;
    bottom: 128px;
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

  .video.time-indicator.no-transition {
    transition: none;
  }
</style>
