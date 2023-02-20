<script>
  import { onMount } from "svelte";
  import loadStream from "../helpers/loadStream";
  import newEvent from "../helpers/newEvent";

  export let media;
  export let showUserInterface;
  export let userInterface;
  export let playerStyle;
  export let showWidgetAtBottom;
  export let widgetInterface;
  export let widgetStyle;
  export let widgetPosition;
  export let widgetWidth;
  export let onEvent = () => {};

  // These are set automatically.
  export let video;
  export let videoIsMaximized = false;
  export let hls = null;

  $: activeStyle = videoIsMaximized ? "video" : playerStyle;

  $: showBehindWidget = showWidgetAtBottom && widgetStyle === "video" && !videoIsMaximized;
  $: showBehindStatic = showUserInterface && activeStyle === "video" && !showBehindWidget;

  $: position = showBehindWidget && widgetPosition !== "auto" ? `fixed-${widgetPosition}` : "";
  $: style = showBehindWidget ? `width: ${widgetWidth}` : "";

  $: sources = [media].flat().filter(m => m);
  $: hls = loadStream(sources[0], video, hls);

  $: if (userInterface) { userInterface.videoIsBehind = showBehindStatic; }
  $: if (widgetInterface) { widgetInterface.videoIsBehind = showBehindWidget; }

  const handlePlay = () => {
    onEvent(newEvent({
      type: "PlaybackStarted",
      description: "The media started playing from its current playback time.",
      initiatedBy: "media",
      fromWidget: showBehindWidget,
    }));
  };

  const handlePause = () => {
    onEvent(newEvent({
      type: "PlaybackPaused",
      description: "The media became paused at its current playback time.",
      initiatedBy: "media",
      fromWidget: showBehindWidget,
    }));
  };

  const handleEnded = () => {
    onEvent(newEvent({
      type: "PlaybackEnded",
      description: "The media finished playing.",
      initiatedBy: "media",
      fromWidget: showBehindWidget,
    }));
  };

  const handleDurationChange = () => {
    onEvent(newEvent({
      type: "MediaDurationUpdated",
      description: "The media's duration was updated.",
      initiatedBy: "media",
      fromWidget: showBehindWidget,
    }));
  };

  const handleTimeUpdate = () => {
    onEvent(newEvent({
      type: "PlaybackTimeUpdated",
      description: "The media's current playback time was updated.",
      initiatedBy: "media",
      fromWidget: showBehindWidget,
    }));
  };

  const handleRateChange = () => {
    onEvent(newEvent({
      type: "PlaybackSpeedUpdated",
      description: "The media's current playback speed was updated.",
      initiatedBy: "media",
      fromWidget: showBehindWidget,
    }));
  };

  const handleFullScreenChange = () => {
    onEvent(newEvent({
      type: "FullScreenModeUpdated",
      description: "The browser entered or exited full screen mode.",
      initiatedBy: "browser",
      fromWidget: showBehindWidget,
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

<div class="media-element {position}" class:behind-static={showBehindStatic} class:behind-widget={showBehindWidget} {style}>
  <div class="inner">
    <video bind:this={video}
           preload="metadata"
           disablePictureInPicture
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
