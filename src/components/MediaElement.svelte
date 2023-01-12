<script>
  import newEvent from "../helpers/newEvent";

  export let showUserInterface;
  export let userInterface;
  export let interfaceStyle;
  export let showWidgetAtBottom;
  export let widgetInterface;
  export let widgetStyle;
  export let widgetPosition;
  export let widgetWidth;
  export let playlist;
  export let playlistIndex;
  export let onEvent = () => {};

  // This is set automatically.
  export let video;

  $: showBehindWidget = showWidgetAtBottom && widgetStyle === "video";
  $: showBehindStatic = showUserInterface && interfaceStyle === "video" && !showBehindWidget;

  $: position = showBehindWidget && widgetPosition !== "auto" ? `fixed-${widgetPosition}` : "";
  $: style = showBehindWidget ? `width: ${widgetWidth}` : "";

  $: playlistItem = playlist[playlistIndex];
  $: media = [playlistItem?.media].flat().filter(m => m);

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
</script>

<div class="media-element {position}" class:behind-static={showBehindStatic} class:behind-widget={showBehindWidget} {style}>
  <div class="inner">
    <video bind:this={video} poster={playlistItem?.image || null} on:play={handlePlay} on:pause={handlePause} on:timeupdate={handleTimeUpdate} on:ratechange={handleRateChange}>
      {#each media as source}
        <source src={source}>
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
</style>
