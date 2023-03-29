<script>
  import { onMount } from "svelte";
  import VastContainer from "./VastContainer.svelte";
  import loadMedia from "../helpers/loadMedia";
  import newEvent from "../helpers/newEvent";

  export let contentItem;
  export let activeAdvert;
  export let advertConsent;
  export let playbackState;
  export let duration;
  export let currentTime;
  export let playbackRate;
  export let prevPercentage;
  export let videoBehindWidget;
  export let videoBehindStatic;
  export let widgetPosition;
  export let widgetWidth;
  export let onEvent = () => {};

  let video;
  let hls = null;

  $: media = activeAdvert?.media;
  $: !activeAdvert && (media = contentItem?.media);

  $: sources = [media].flat().filter(m => m);
  $: hls = loadMedia(sources[0], video, hls, handleHlsError);

  $: vastUrl = activeAdvert?.vastUrl;
  $: customUrl = activeAdvert?.clickThroughUrl;

  $: sources, !vastUrl && (playbackState === "playing" ? video?.play() : video?.pause());
  $: sources, prevPercentage = 0;

  $: position = videoBehindWidget && widgetPosition !== "auto" ? `fixed-${widgetPosition}` : "";
  $: style = videoBehindWidget ? `width: ${widgetWidth}` : "";

  $: poster = playbackState !== "stopped" && (activeAdvert?.imageUrl || contentItem?.imageUrl);

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
    // Ensure the correct duration is sent to analytics for vast ads.
    if (vastUrl) { return; }

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

  const handleSourceError = (sourceIndex) => () => {
    const isLastSource = sourceIndex === sources.length - 1;
    if (!isLastSource) { return; }

    onEvent(newEvent({
      type: "PlaybackErrored",
      description: "The media failed to play.",
      initiatedBy: "media",
      fromWidget: videoBehindWidget,
      mediaType: "native",
      mediaUrl: sources[0].url,
      errorMessage: "The video tag contains sources but none are playable.",
    }));
  };

  const handleHlsError = (event, data) => {
    if (!data.fatal) { return; }

    hls?.destroy();
    hls = null;

    onEvent(newEvent({
      type: "PlaybackErrored",
      description: "The media failed to play.",
      initiatedBy: "media",
      fromWidget: videoBehindWidget,
      mediaType: "HLS",
      mediaUrl: sources[0].url,
      errorMessage: `${data.type} ${data.details}`,
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
           poster={poster || ""}
           preload="metadata"
           playsinline
           disablepictureinpicture
           on:play={handlePlay}
           on:pause={handlePause}
           on:ended={handleEnded}
           on:durationchange={handleDurationChange}
           on:timeupdate={handleTimeUpdate}
           on:ratechange={handleRateChange}>

      {#each sources as { url, contentType }, i}
        <source src={url} type={contentType} on:error={handleSourceError(i)}>
      {/each}

      <track kind="captions">
    </video>

    {#if vastUrl}
      <VastContainer {onEvent} {vastUrl} {advertConsent} {video} bind:playbackState bind:duration bind:currentTime {videoBehindWidget} />
    {/if}

    {#if customUrl}
      <a class="custom-advert-link" href={customUrl} target="_blank" rel="noreferrer">&nbsp;</a>
    {/if}
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
    border-radius: 8px;
    overflow: hidden;
    min-width: 300px;
    max-width: 720px;
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
    margin: 16px;
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
    max-width: min(720px, 100% - 32px);
  }

  .custom-advert-link {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    text-decoration: none;
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
