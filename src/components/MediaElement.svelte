<script>
  import { onMount } from "svelte";
  import loadMedia from "../helpers/loadMedia";
  import newEvent from "../helpers/newEvent";

  export let media;
  export let playbackState;
  export let duration;
  export let currentTime;
  export let playbackRate;
  export let videoBehindWidget;
  export let videoBehindStatic;
  export let widgetPosition;
  export let widgetWidth;
  export let onEvent = () => {};

  // These are set automatically.
  export let video;
  export let hls = null;

  $: position = videoBehindWidget && widgetPosition !== "auto" ? `fixed-${widgetPosition}` : "";
  $: style = videoBehindWidget ? `width: ${widgetWidth}` : "";

  $: sources = [media].flat().filter(m => m);
  $: hls = loadMedia(sources[0], video, hls);

  $: sources, playbackState === "playing" ? video?.play() : video?.pause();

  const handlePlay = () => {
    onEvent(newEvent({
      type: "PlaybackPlaying",
      description: "The media began playing from its current playback time.",
      initiatedBy: "media",
      fromWidget: videoBehindWidget,
    }));
  };

  const handlePause = () => {
    onEvent(newEvent({
      type: "PlaybackPaused",
      description: "The media became paused at its current playback time.",
      initiatedBy: "media",
      fromWidget: videoBehindWidget,
    }));
  };

  const handleEnded = () => {
    onEvent(newEvent({
      type: "PlaybackEnded",
      description: "The media finished playing because it reached the end.",
      initiatedBy: "media",
      fromWidget: videoBehindWidget,
    }));
  };

  const handleDurationChange = () => {
    onEvent(newEvent({
      type: "DurationUpdated",
      description: "The media's duration was updated.",
      initiatedBy: "media",
      fromWidget: videoBehindWidget,
    }));
  };

  const handleTimeUpdate = () => {
    onEvent(newEvent({
      type: "CurrentTimeUpdated",
      description: "The media's current time was updated.",
      initiatedBy: "media",
      fromWidget: videoBehindWidget,
    }));
  };

  const handleRateChange = () => {
    onEvent(newEvent({
      type: "PlaybackRateUpdated",
      description: "The media's playback rate was updated.",
      initiatedBy: "media",
      fromWidget: videoBehindWidget,
    }));
  };

  const handleFullScreenChange = () => {
    onEvent(newEvent({
      type: "FullScreenModeUpdated",
      description: "The browser entered or exited full screen mode.",
      initiatedBy: "browser",
      fromWidget: videoBehindWidget,
    }));
  };

  onMount(() => {
    const listener1 = addEventListener("fullscreenchange", handleFullScreenChange);
    const listener2 = addEventListener("webkitfullscreenchange", handleFullScreenChange);

    return () => {
      removeEventListener("fullscreenchange", listener1);
      removeEventListener("fullscreenchange", listener2);
    };
  });
</script>

<div class="media-element {position}" class:behind-static={videoBehindStatic} class:behind-widget={videoBehindWidget} {style}>
  <div class="inner">
    <video bind:this={video}
           bind:duration
           bind:currentTime
           bind:playbackRate
           preload="metadata"
           playsinline
           disablepictureinpicture
           on:play={handlePlay}
           on:pause={handlePause}
           on:ended={handleEnded}
           on:durationchange={handleDurationChange}
           on:timeupdate={handleTimeUpdate}
           on:ratechange={handleRateChange}>

      {#each sources as { url, contentType }}
        <source src={url} type={contentType}>
      {/each}

      <track kind="captions">
    </video>
  </div>
</div>

<style>
  :global(.beyondwords-player) {
    position: relative;
  }

  .media-element {
    display: none;
    align-items: center;
    justify-content: center;
    background: black;
    border-radius: 0.5rem;
    overflow: hidden;
    min-width: 360px;
    max-width: 720px;
    z-index: -1;
  }

  .inner {
    width: 100%;
    height: 0;
    padding-bottom: 56.25%;
    position: relative;
  }

  .inner video {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .behind-static {
    display: flex;
    position: absolute;
    width: 100%;
  }

  .behind-widget {
    display: flex;
    position: fixed;
    width: 0;
    bottom: 0;
    right: 0;
    margin: 1rem;
    animation: fly-widget 0.33s forwards;
    opacity: 0;
    z-index: 999;
  }

  .fixed-left {
    right: auto;
    left: 0;
  }

  .fixed-center {
    left: 0;
    margin-left: auto;
    margin-right: auto;
    max-width: min(720px, 100% - 2rem);
  }

  @keyframes fly-widget {
    from { bottom: -100px; opacity: 0; }
    to { bottom: 0; opacity: 1; }
  }

  :global(.beyondwords-player.maximized) {
    display: flex;
    align-items: center;
    background: black;
  }

  :global(.beyondwords-player.maximized) .media-element {
    max-width: none;
    border-radius: 0;
  }
</style>
