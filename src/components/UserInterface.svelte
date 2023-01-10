<script>
  import "@fontsource/inter/variable.css";
  import { fly } from "svelte/transition";
  import PlayButton from "./buttons/PlayButton.svelte";
  import PauseButton from "./buttons/PauseButton.svelte";
  import SpeedButton from "./buttons/SpeedButton.svelte";
  import PrevButton from "./buttons/PrevButton.svelte";
  import NextButton from "./buttons/NextButton.svelte";
  import PlaylistButton from "./buttons/PlaylistButton.svelte";
  import SecondaryButton from "./buttons/SecondaryButton.svelte";
  import NewTabButton from "./buttons/NewTabButton.svelte";
  import AdvertButton from "./buttons/AdvertButton.svelte";
  import MaximizeButton from "./buttons/MaximizeButton.svelte";
  import BackToTopButton from "./buttons/BackToTopButton.svelte";
  import CloseButton from "./buttons/CloseButton.svelte";
  import AdvertLink from "./external_links/AdvertLink.svelte";
  import BeyondWords from "./external_links/BeyondWords.svelte";
  import LargeImage from "./LargeImage.svelte";
  import PlayerTitle from "./titles/PlayerTitle.svelte";
  import PodcastTitle from "./titles/PodcastTitle.svelte";
  import ProgressBar from "./progress_bars/ProgressBar.svelte";
  import ProgressCircle from "./progress_bars/ProgressCircle.svelte";
  import TimeIndicator from "./time_indicators/TimeIndicator.svelte";
  import Playlist from "./Playlist.svelte";
  import Hoverable from "./helpers/Hoverable.svelte";
  import Visibility from "./helpers/Visibility.svelte";
  import belowBreakpoint from "../helpers/belowBreakpoint";
  import controlsOrderFn from "../helpers/controlsOrder";

  export let interfaceStyle = "standard";
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playerTitle = undefined;
  export let posterImage = undefined;
  export let fixedPosition = undefined;
  export let fixedWidth = "auto";
  export let podcasts = [];
  export let podcastIndex = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let currentAdvert = undefined;
  export let onEvent = () => {};

  // These are set automatically.
  export let videoPlaceholder = undefined;
  export let isVisible = undefined;
  export let relativeY = undefined;
  export let absoluteY = undefined;
  let width, isHovering;

  $: isSmall = interfaceStyle === "small";
  $: isStandard = interfaceStyle === "standard";
  $: isLarge = interfaceStyle === "large";
  $: isScreen = interfaceStyle === "screen";
  $: isVideo = interfaceStyle === "video";
  $: isPlaying = playbackState === "playing";
  $: isPaused = playbackState === "paused";
  $: isStopped = playbackState === "stopped";
  $: isAdvert = currentAdvert && !isStopped;
  $: isPlaylist = podcasts.length > 1;
  $: isMobile = belowBreakpoint({ interfaceStyle, width });

  $: podcast = podcasts[podcastIndex] || {};
  $: duration = isAdvert ? currentAdvert.duration : podcast.duration;
  $: progress = isStopped ? 0 : currentTime / duration;

  $: skipStyle = skipButtonStyle === "auto" ? (isPlaylist ? "tracks" : "segments") : skipButtonStyle;
  $: buttonColor = isVideo ? "rgba(250, 250, 250, 0.8)" : "#323232";

  $: buttonScale = isSmall ? 0.8 : (isScreen || isVideo && isStopped) && !isMobile ? 2 : 1;
  $: playPauseScale = isScreen ? buttonScale * 1.5 : buttonScale;
  $: closeScale = isScreen && !isMobile ? 2.5 : isScreen ? 1.75 : isVideo && !isMobile ? 2 : isVideo ? 1.5 : 1;
  $: logoScale = isScreen && !isMobile ? 3 : isScreen ? 2 : isVideo && !isMobile ? 1.5 : 1;

  $: widthStyle = fixedWidth === "auto" && isSmall ? "fit-content" : fixedWidth;
  $: position = fixedPosition === "auto" ? (isStandard ? "center" : "right") : fixedPosition;
  $: positionClasses = fixedPosition ? `fixed fixed-${position}` : "";
  $: flyWidget = (e) => fixedPosition && fly(e, { y: isSmall || isStandard ? 40 : 100 });

  $: controlsOrder = controlsOrderFn({ interfaceStyle, position, isMobile, isAdvert });

  $: collapsible = isSmall && fixedPosition && fixedWidth === "auto";
  $: forcedCollapsed = isSmall && fixedWidth === 0;
  $: collapsed = forcedCollapsed || collapsible && !isAdvert && !isStopped && !isHovering;

  $: classes = `user-interface ${interfaceStyle} ${playbackState} ${positionClasses} ${controlsOrder}`;
</script>

{#if isSmall || isStandard || isLarge || isScreen || isVideo}
  <div class={classes} style="width: {widthStyle}" class:mobile={isMobile} class:advert={isAdvert} class:hovering={isHovering} class:collapsed bind:clientWidth={width} transition:flyWidget>
    <Hoverable bind:isHovering graceTime={collapsible ? 500 : 0} enabled={collapsible || isVideo}>
      {#if isVideo}
        <div class="video-placeholder" bind:this={videoPlaceholder} style={posterImage && `background: url(${posterImage}); background-size: contain`}></div>
      {/if}

      <div class="main">
        {#if isLarge || isScreen}
          <LargeImage src={isAdvert ? (currentAdvert.image || podcast.image) : podcast.image} scale={isScreen && !isMobile ? 1.5 : 1} />
        {/if}

        {#if isVideo && fixedPosition}
          <div class="back-to-top">
            <BackToTopButton scale={isMobile ? 1.5 : 2} color={buttonColor} />
          </div>
        {/if}

        {#if isLarge || isScreen || isVideo}
          <div class="summary">
            <PlayerTitle title={playerTitle} visible={!isAdvert && !isScreen} {interfaceStyle} scale={isScreen ? 2 : 1} />

            {#if isLarge || isScreen || isVideo && !(podcast.image && isStopped) && !fixedPosition}
              <PodcastTitle title={podcast.title} maxLines={(isMobile || isScreen) && !isVideo ? 3 : 1} scale={isScreen ? 2 : isVideo && !isMobile ? 1.6 : isVideo ? 1.2 : 1} maxWidth={isScreen && !isMobile ? 40 : isScreen ? 20 : null} color={isVideo ? "rgba(217, 217, 217, 0.9)" : "#323232"} />
            {/if}
          </div>
        {/if}

        <div class="controls">
          <Visibility enabled={!fixedPosition} bind:isVisible bind:relativeY bind:absoluteY onChange={onEvent}>
            <ProgressCircle {progress} enabled={isScreen || isSmall && fixedPosition} bold={isSmall} scale={playPauseScale} color={isAdvert ? "#00cdbc" : "#323232"}>
              {#if isPlaying}
                <PauseButton scale={playPauseScale} color={buttonColor} />
              {:else}
                <PlayButton scale={playPauseScale} color={buttonColor} />
              {/if}
            </ProgressCircle>
          </Visibility>

          {#if isStandard && isStopped || isSmall}
            <PlayerTitle title="Listen to this article" visible={!isAdvert} {interfaceStyle} {collapsible} {collapsed} />
          {/if}

          {#if !isSmall && !isStopped && !isAdvert || (isScreen && isAdvert)}
            <SpeedButton scale={buttonScale} color={buttonColor} />
            <PrevButton style={skipStyle} scale={buttonScale} color={buttonColor} />
            <NextButton style={skipStyle} scale={buttonScale} color={buttonColor} />
          {/if}

          {#if isStandard && !isStopped && !isAdvert && width > 720 && controlsOrder !== "left-to-right-but-swap-ends"}
            <PodcastTitle title={podcast.title} maxLines={1} bold={true} scale={1.2} flex={0.52} />
          {/if}

          <TimeIndicator {currentTime} {duration} {interfaceStyle} {isAdvert} {isMobile} {isStopped} {positionClasses} {collapsed} color={buttonColor} />

          {#if (isStandard && !isMobile && !isStopped) || (isLarge && !isMobile) || (isVideo && !isStopped)}
            <ProgressBar {progress} fullWidth={isVideo} />
          {/if}

          {#if isAdvert && !forcedCollapsed}
            <AdvertLink href={currentAdvert.url} {interfaceStyle} scale={isScreen ? 2 : 1} {controlsOrder} />
            <AdvertButton href={currentAdvert.url} {interfaceStyle} scale={buttonScale} {controlsOrder} color={buttonColor} />
          {/if}

          {#if !isStopped}
            <SecondaryButton {interfaceStyle} {isMobile} {isAdvert} scale={buttonScale}>
              {#if isVideo}
                <MaximizeButton scale={buttonScale} color={buttonColor} />
              {:else if isScreen && podcast.externalUrl}
                <NewTabButton scale={buttonScale} href={podcast.externalUrl} color={buttonColor} />
              {:else if isPlaylist && !fixedPosition}
                <PlaylistButton scale={buttonScale} color={buttonColor} />
              {/if}
            </SecondaryButton>
          {/if}
        </div>

        {#if !isAdvert && !(isSmall && fixedPosition) || isScreen || isVideo}
          <div class="end">
            {#if fixedPosition}
              <CloseButton scale={closeScale} color={buttonColor} margin={isScreen && !isMobile ? "0.75rem 0" : isScreen ? "0.25rem 0" : "auto"} />
            {:else}
              <BeyondWords scale={logoScale} />
            {/if}
          </div>
        {/if}
      </div>
    </Hoverable>

    {#if !isSmall && !isScreen}
      <Playlist style={playlistStyle} podcasts={podcasts} index={podcastIndex} isMobile={isMobile} />
    {/if}
  </div>
{/if}

<style>
  .user-interface {
    overflow: hidden;
  }

  .user-interface :global(*) {
    font-family: "InterVariable", sans-serif;
    color: #323232;
  }

  .fixed {
    position: fixed;
    bottom: 0;
    margin: 1rem;
    max-width: calc(100% - 2rem);
    z-index: 1;
  }

  .fixed-left {
    left: 0;
  }

  .fixed-center {
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }

  .fixed-right {
    right: 0;
  }

  .main {
    box-sizing: border-box;
    background: #fafafa;
    column-gap: 0.5rem;
    transition: padding 0.5s;
  }

  .summary {
    max-width: 100%;
  }

  .controls {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    column-gap: 0.5rem;
    grid-row: 2;
    grid-column: 2 / span 2;
    min-width: 0;
  }

  .collapsed .controls {
    column-gap: 0;
    transition: column-gap 1.25s;
  }

  .right-to-left .controls :global(.advert-button)  { order: 1; }
  .right-to-left .controls :global(.advert-link)    { order: 2; }
  .right-to-left .controls :global(.progress-bar)   { order: 3; }
  .right-to-left .controls :global(.player-title)   { order: 4; }
  .right-to-left .controls :global(.time-indicator) { order: 5; }
  .right-to-left .controls :global(.prev-button)    { order: 6; }
  .right-to-left .controls :global(.next-button)    { order: 7; }
  .right-to-left .controls :global(.speed-button)   { order: 8; }
  .right-to-left .controls :global(.visibility)     { order: 9; }

  .symmetrical .controls :global(.prev-button)      { order: 1; }
  .symmetrical .controls :global(.speed-button)     { order: 2; }
  .symmetrical .controls :global(.visibility)       { order: 3; }
  .symmetrical .controls :global(.secondary-button) { order: 4; }
  .symmetrical .controls :global(.next-button)      { order: 5; }

  .left-to-right-but-swap-ends .controls :global(.visibility) { order: 1; }

  .advert .controls {
    justify-content: space-between;
  }

  .symmetrical .controls {
    justify-content: center;
  }

  .standard {
    min-width: 300px;
  }

  .standard .main {
    height: 3rem;
    padding: 0.25rem;
    border-radius: 1.5625rem;
    display: flex;
    align-items: center;
  }

  .standard.right-to-left .main,
  .standard.left-to-right-but-swap-ends .main {
    flex-direction: row-reverse;
  }

  .standard .end {
    margin-right: 0.75rem;
  }

  .standard.right-to-left .end,
  .standard.left-to-right-but-swap-ends .end {
    margin-left: 0.75rem;
    margin-right: 0;
  }

  .large {
    min-width: 300px;
  }

  .large .main {
    height: 6rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }

  .large.advert .controls {
    justify-content: space-between;
  }

  .large .controls {
    align-self: flex-end;
  }

  .large.mobile .main {
    height: 9rem;
  }

  .large.mobile .controls {
    grid-row: 3;
    grid-column: 1 / span 3;
  }

  .small {
    min-width: 40px;
  }

  .small .main {
    height: 2.5rem;
    padding: 0.25rem;
    border-radius: 1.25rem;
    display: flex;
    align-items: center;
  }

  .small .end {
    margin-right: 0.25rem;
  }

  .small.left-to-right .main {
    padding-right: 0.5rem;
  }

  .small.collapsed.left-to-right .main {
    padding-right: 0;
  }

  .small.right-to-left .main {
    padding-left: 1rem;
  }

  .small.left-to-right.advert .main {
    padding-right: 0.25rem;
  }

  .small.right-to-left.advert .main {
    padding-left: 0.25rem;
  }

  .small.collapsed.right-to-left .main {
    padding-left: 0;
  }

  .screen {
    min-width: 300px;
  }

  .screen .main {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    row-gap: 2.5rem;
    padding: 2.5rem;
  }

  .screen.mobile .main {
    padding: 2rem;
  }

  .screen .summary {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .screen .controls {
    flex-grow: 0;
    column-gap: 2.5rem;
    margin-bottom: 14.5rem;
  }

  .screen.mobile .controls {
    column-gap: 0.5rem;
    margin-top: -0.5rem;
    margin-bottom: 9.25rem;
  }

  .screen .end {
    order: -1;
    align-self: flex-end;
    margin-bottom: -2rem;
  }

  .screen.mobile .end {
    margin-bottom: 2rem;
  }

  .video {
    min-width: 360px;
    max-width: 720px;
    border-radius: 0.5rem;
    transition: background-color 0.25s;
  }

  .video :global(.hoverable) {
    position: relative;
    padding-bottom: 56.25%;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .video .video-placeholder {
    position: absolute;
    width: 100%;
    height: 100%;
    background: black;
  }

  .video .video-placeholder:global(.showing-video) {
    background: transparent !important;
  }

  .video .main {
    position: absolute;
    width: 100%;
    height: 100%;
    background: transparent;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto minmax(0, 1fr) auto;
    cursor: pointer;
  }

  .video .summary {
    margin: 1rem;
    cursor: auto;
    display: flex;
  }

  .video .end {
    grid-row: 1;
    grid-column: 3;
    margin: 1rem;
    margin-left: auto;
  }

  .video .controls {
    grid-row: 3;
    grid-column: 1 / span 3;
    padding-bottom: 0.5rem;
    position: relative;
    padding: 0.5rem 1rem;
    cursor: auto;
  }

  .video .controls > :global(*) {
    opacity: 0;
    transition: opacity 0.25s;
    pointer-events: none;
  }

  .video.stopped .controls > :global(*),
  .video.paused .controls > :global(*),
  .video.hovering .controls > :global(*),
  .video.advert .controls > :global(.time-indicator),
  .video.advert .controls > :global(.advert-link) {
    opacity: 1;
    pointer-events: auto;
  }

  .video.advert .controls > :global(.time-indicator) {
    position: absolute;
    top: -2rem;
    left: 1rem;
  }

  .video.advert .controls > :global(.advert-link) {
    position: absolute;
    right: 1rem;
    top: -2.25rem;
  }

  .video.advert.mobile .controls > :global(.time-indicator) {
    left: 0.5rem;
  }

  .video.advert.mobile .controls > :global(.advert-link) {
    right: 0.5rem;
  }

  .video.advert.fixed .controls > :global(.time-indicator) {
    left: 0.75em;
  }

  .video.advert.fixed .controls > :global(.advert-link) {
    right: 0.75rem;
  }

  .video :global(.next-button) {
    margin-left: 0.5rem;
  }

  .video.advert .controls {
    column-gap: 1rem;
  }

  .video.stopped .controls {
    pointer-events: none;
    padding: 1rem;
  }

  .video.stopped.right-to-left .controls {
    flex-direction: row-reverse;
  }

  .video.paused :global(.hoverable),
  .video.hovering :global(.hoverable) {
    background: rgba(0, 0, 0, 0.2);
  }

  .video.mobile .controls {
    padding: 0.5rem;
  }

  .video.mobile .summary,
  .video.mobile .end {
    margin: 0.5rem;
  }

  .video.fixed .back-to-top,
  .video.fixed .end {
    margin: 1rem;
  }

  .video.fixed.mobile .back-to-top,
  .video.fixed.mobile .end {
    margin: 0.75rem;
  }

  .video.fixed .controls {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
</style>
