<script>
  import "@fontsource/inter/variable.css";
  import { fly } from "svelte/transition";
  import PlayPauseButton from "./buttons/PlayPauseButton.svelte";
  import SpeedButton from "./buttons/SpeedButton.svelte";
  import PrevButton from "./buttons/PrevButton.svelte";
  import NextButton from "./buttons/NextButton.svelte";
  import PlaylistButton from "./buttons/PlaylistButton.svelte";
  import SecondaryButton from "./buttons/SecondaryButton.svelte";
  import MaximizeButton from "./buttons/MaximizeButton.svelte";
  import ScrollToPlayerButton from "./buttons/ScrollToPlayerButton.svelte";
  import CloseWidgetButton from "./buttons/CloseWidgetButton.svelte";
  import AdvertLink from "./external_links/AdvertLink.svelte";
  import AdvertButton from "./external_links/AdvertButton.svelte";
  import BeyondWords from "./external_links/BeyondWords.svelte";
  import ExternalUrlButton from "./external_links/ExternalUrlButton.svelte";
  import LargeImage from "./LargeImage.svelte";
  import PlayerTitle from "./titles/PlayerTitle.svelte";
  import ContentTitle from "./titles/ContentTitle.svelte";
  import ProgressBar from "./progress_bars/ProgressBar.svelte";
  import ProgressCircle from "./progress_bars/ProgressCircle.svelte";
  import TimeIndicator from "./time_indicators/TimeIndicator.svelte";
  import Playlist from "./Playlist.svelte";
  import Hoverable from "./helpers/Hoverable.svelte";
  import Visibility from "./helpers/Visibility.svelte";
  import belowBreakpoint from "../helpers/belowBreakpoint";
  import controlsOrderFn from "../helpers/controlsOrder";
  import findSegmentIndex from "../helpers/findSegmentIndex";
  import { knownPlayerStyle } from "../helpers/playerStyles";
  import newEvent from "../helpers/newEvent";
  import { canFullScreen } from "../helpers/fullScreen";

  export let playerStyle = "standard";
  export let callToAction = "Listen to this article";
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playerTitle = undefined;
  export let fixedPosition = undefined;
  export let fixedWidth = "auto";
  export let content = [];
  export let contentIndex = 0;
  export let duration = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let playbackRate = 1;
  export let activeAdvert = undefined;
  export let textColor = "#111";
  export let backgroundColor = "#F5F5F5";
  export let iconColor = "black";
  export let onEvent = () => {};

  // These are set automatically.
  export let videoIsBehind = false;
  export let isVisible = undefined;
  export let relativeY = undefined;
  export let absoluteY = undefined;
  let width, isHovering;

  $: isSmall = playerStyle === "small";
  $: isStandard = playerStyle === "standard";
  $: isLarge = playerStyle === "large";
  $: isScreen = playerStyle === "screen";
  $: isVideo = playerStyle === "video";
  $: isPlaying = playbackState === "playing";
  $: isPaused = playbackState === "paused";
  $: isStopped = playbackState === "stopped";
  $: isAdvert = activeAdvert && !isStopped;
  $: isPlaylist = content.length > 1;
  $: isMobile = belowBreakpoint({ playerStyle, width });

  $: contentItem = content[contentIndex] || {};
  $: segments = contentItem.segments || [];

  $: progress = currentTime / duration;
  $: segmentIndex = isAdvert ? -1 : findSegmentIndex(segments, currentTime);
  $: currentSegment = segments[segmentIndex];

  $: activeTextColor = isAdvert && activeAdvert?.textColor || textColor;
  $: activeBackgroundColor = isAdvert && activeAdvert?.backgroundColor || backgroundColor;
  $: activeIconColor = isAdvert && activeAdvert?.iconColor || iconColor;

  $: skipStyle = skipButtonStyle === "auto" ? (isPlaylist ? "tracks" : "segments") : skipButtonStyle;
  $: skipDisabled = skipStyle === "segments";
  $: buttonColor = isVideo ? "rgba(250, 250, 250, 0.8)" : activeIconColor;

  $: buttonScale = isSmall ? 0.8 : (isScreen || isVideo && isStopped) && !isMobile ? 2 : 1;
  $: playPauseScale = isScreen ? buttonScale * 1.5 : buttonScale;
  $: logoScale = isScreen && !isMobile ? 3 : isScreen ? 2 : isVideo && !isMobile ? 1.5 : 1;
  $: closeScale = isScreen && !isMobile ? 2.5 : isScreen ? 1.75 : isVideo && !isMobile ? 2 : isVideo ? 1.5 : 1;
  $: closeMargin = isScreen && !isMobile ? "12px 0" : isScreen ? "4px 0" : "auto";

  $: widthStyle = fixedWidth === "auto" ? (isSmall ? "fit-content" : "") : fixedWidth;
  $: position = fixedPosition === "auto" ? (isStandard ? "center" : "right") : fixedPosition;
  $: positionClasses = fixedPosition ? `fixed fixed-${position}` : "";
  $: flyWidget = (e) => fixedPosition && fly(e, { y: isSmall || isStandard ? 40 : 100 });

  $: controlsOrder = controlsOrderFn({ playerStyle, position, isMobile, isAdvert });
  $: posterImage = isStopped ? contentItem.imageUrl : null;

  $: collapsible = isSmall && fixedPosition && fixedWidth === "auto";
  $: forcedCollapsed = isSmall && fixedWidth === 0;
  $: collapsed = forcedCollapsed || collapsible && !isAdvert && !isStopped && !isHovering;

  $: classes = `user-interface ${playerStyle} ${playbackState} ${positionClasses} ${controlsOrder}`;

  const handleMouseDown = () => {
    onEvent(newEvent({
      type: "PressedVideoBackground",
      description: "The video background was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

{#if knownPlayerStyle(playerStyle) && content.length > 0}
  <div class={classes} style="width: {widthStyle}" class:mobile={isMobile} class:advert={isAdvert} class:hovering={isHovering} class:collapsed bind:clientWidth={width} transition:flyWidget>
    <Hoverable bind:isHovering enabled={collapsible || isVideo} exitDelay={collapsible ? 500 : 0} idleDelay={isVideo ? 3000 : Infinity}>
      {#if isVideo && (posterImage || !videoIsBehind)}
        <div class="video-placeholder" style={posterImage ? `background-image: url(${posterImage})` : ""} />
      {/if}

      <div class="main" data-is-video-main={isVideo} on:mousedown={e => e.target.dataset.isVideoMain && handleMouseDown()} on:keyup={null} style="background: {isVideo ? "transparent" : activeBackgroundColor}">
        {#if isLarge || isScreen}
          <LargeImage src={isAdvert && activeAdvert.imageUrl || contentItem.imageUrl} scale={isScreen && !isMobile ? 1.5 : 1} />
        {/if}

        {#if isVideo && fixedPosition}
          <div class="scroll-to-player">
            <ScrollToPlayerButton {onEvent} scale={isMobile ? 1.5 : 2} color={buttonColor} />
          </div>
        {/if}

        {#if isLarge || isScreen || isVideo}
          <div class="summary">
            <PlayerTitle title={playerTitle} visible={!isAdvert && !isScreen} {playerStyle} scale={isScreen ? 2 : 1} color={activeTextColor} />

            {#if isLarge || isScreen || isVideo && !(contentItem.imageUrl && isStopped) && !fixedPosition && !isAdvert}
              <ContentTitle title={contentItem.title} maxLines={(isMobile || isScreen) && !isVideo ? 3 : 1} center={isScreen} scale={isScreen ? 2 : isVideo && !isMobile ? 1.6 : isVideo ? 1.2 : 1} maxWidth={isScreen && !isMobile ? 640 : isScreen ? 320 : null} color={isVideo ? "rgba(217, 217, 217, 0.9)" : activeTextColor} />
            {/if}
          </div>
        {/if}

        <div class="controls">
          <Visibility {onEvent} enabled={!fixedPosition} bind:isVisible bind:relativeY bind:absoluteY>
            <ProgressCircle {onEvent} {progress} enabled={isScreen || isSmall} bold={isSmall} scale={playPauseScale} color={isAdvert ? "#00cdbc" : activeIconColor}>
              <PlayPauseButton {onEvent} {isPlaying} tabindex={isScreen || isSmall ? -1 : 0} scale={playPauseScale} color={buttonColor} />
            </ProgressCircle>
          </Visibility>

          {#if isStandard && isStopped || isSmall}
            <PlayerTitle title={callToAction || ""} visible={!isAdvert} {playerStyle} {collapsible} {collapsed} color={activeTextColor} />
          {/if}

          {#if !isSmall && !isStopped && !isAdvert || (isScreen && isAdvert)}
            <SpeedButton {onEvent} speed={playbackRate} scale={buttonScale} color={buttonColor} />
            <PrevButton {onEvent} style={skipStyle} scale={buttonScale} color={buttonColor} disabled={skipStyle === "segments" && segmentIndex <= 0} />
            <NextButton {onEvent} style={skipStyle} scale={buttonScale} color={buttonColor} disabled={skipStyle === "segments" && segmentIndex >= segments.length - 1} />
          {/if}

          {#if isStandard && !isStopped && !isAdvert && width > 720 && controlsOrder !== "left-to-right-but-swap-ends"}
            <ContentTitle title={contentItem.title} maxLines={1} bold={true} scale={1.2} flex={0.52} color={activeTextColor} />
          {/if}

          <TimeIndicator {currentTime} {duration} {playerStyle} {isAdvert} {isMobile} {isStopped} {positionClasses} {collapsed} color={isVideo ? buttonColor : activeTextColor} />

          {#if (isStandard && !isMobile && !isStopped) || (isLarge && !isMobile) || (isVideo && !isStopped)}
            <ProgressBar {onEvent} {progress} fullWidth={isVideo} color={activeIconColor} />
          {/if}

          {#if isAdvert && !forcedCollapsed}
            <AdvertLink {onEvent} href={activeAdvert.clickThroughUrl} {playerStyle} scale={isScreen ? 2 : 1} {controlsOrder} />
            <AdvertButton {onEvent} href={activeAdvert.clickThroughUrl} {playerStyle} scale={buttonScale} {controlsOrder} color={buttonColor} />
          {/if}

          {#if !isStopped}
            <SecondaryButton {playerStyle} {isMobile} {isAdvert} scale={buttonScale}>
              {#if isVideo && canFullScreen()}
                <MaximizeButton {onEvent} scale={buttonScale} color={buttonColor} />
              {:else if isScreen && contentItem.sourceUrl}
                <ExternalUrlButton {onEvent} scale={buttonScale} href={contentItem.sourceUrl} color={buttonColor} />
              {:else if isPlaylist && !fixedPosition}
                <PlaylistButton {onEvent} scale={buttonScale} color={buttonColor} />
              {/if}
            </SecondaryButton>
          {/if}
        </div>

        {#if !isAdvert && !(isSmall && fixedPosition) || isScreen || isVideo}
          <div class="end">
            {#if fixedPosition}
              <CloseWidgetButton {onEvent} scale={closeScale} margin={closeMargin} color={buttonColor} />
            {:else}
              <BeyondWords {onEvent} scale={logoScale} />
            {/if}
          </div>
        {/if}
      </div>
    </Hoverable>

    {#if !isSmall && !isScreen}
      <Playlist {onEvent} style={playlistStyle} {content} index={contentIndex} isMobile={isMobile} textColor={activeTextColor} backgroundColor={activeBackgroundColor} iconColor={activeIconColor} />
    {/if}
  </div>
{/if}

<style>
  .user-interface {
    overflow: hidden;
  }

  .user-interface :global(*) {
    font-family: "InterVariable", sans-serif;
  }

  .fixed {
    position: fixed;
    bottom: 0;
    margin: 16px;
    max-width: calc(100% - 32px);
    z-index: 1000;
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
    column-gap: 8px;
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
    column-gap: 8px;
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
    height: 48px;
    padding: 4px;
    border-radius: 25px;
    display: flex;
    align-items: center;
  }

  .standard.right-to-left .main,
  .standard.left-to-right-but-swap-ends .main {
    flex-direction: row-reverse;
  }

  .standard .end {
    margin-right: 12px;
  }

  .standard.right-to-left .end,
  .standard.left-to-right-but-swap-ends .end {
    margin-left: 12px;
    margin-right: 0;
  }

  .large {
    min-width: 300px;
  }

  .large .main {
    height: 96px;
    padding: 8px;
    border-radius: 8px;
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
    height: 144px;
  }

  .large.mobile .controls {
    grid-row: 3;
    grid-column: 1 / span 3;
  }

  .small {
    min-width: 40px;
  }

  .small .main {
    height: 40px;
    padding: 4px;
    border-radius: 20px;
    display: flex;
    align-items: center;
  }

  .small .end {
    margin-right: 4px;
  }

  .small.left-to-right .main {
    padding-right: 8px;
  }

  .small.collapsed.left-to-right .main {
    padding-right: 0;
  }

  .small.right-to-left .main {
    padding-left: 16px;
  }

  .small.left-to-right.advert .main {
    padding-right: 4px;
  }

  .small.right-to-left.advert .main {
    padding-left: 4px;
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
    row-gap: 40px;
    padding: 40px;
  }

  .screen.mobile .main {
    padding: 32px;
  }

  .screen .summary {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .screen .controls {
    flex-grow: 0;
    column-gap: 40px;
    margin-bottom: 232px;
  }

  .screen.mobile .controls {
    column-gap: 8px;
    margin-top: -8px;
    margin-bottom: 148px;
  }

  .screen .end {
    order: -1;
    align-self: flex-end;
    margin-bottom: -32px;
  }

  .screen.mobile .end {
    margin-bottom: 32px;
  }

  .video {
    min-width: 360px;
    max-width: 720px;
    border-radius: 8px;
    transition: background-color 0.25s;
  }

  .video.advert.playing {
    pointer-events: none;
  }

  .video.advert.playing .scroll-to-player,
  .video.advert.playing .controls,
  .video.advert.playing .end,
  .video.advert.playing :global(.playlist) {
    pointer-events: auto;
  }

  .video.fixed {
    max-width: min(720px, 100% - 32px);
  }

  .video :global(.hoverable) {
    position: relative;
    padding-bottom: 56.25%;
    border-radius: 8px;
    overflow: hidden;
    transition: background-color 0.25s;
  }

  .video .video-placeholder {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    background: #323232;
    background-color: black;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .video .main {
    position: absolute;
    width: 100%;
    height: 100%;
    background: transparent;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto minmax(0, 1fr) auto;
    cursor: none;
  }

  .video.stopped .main,
  .video.paused .main,
  .video.hovering .main {
    cursor: default;
  }

  .video .summary {
    margin: 16px;
    cursor: auto;
    display: flex;
  }

  .video .end {
    grid-row: 1;
    grid-column: 3;
    margin: 16px;
    margin-left: auto;
  }

  .video .controls {
    grid-row: 3;
    grid-column: 1 / span 3;
    padding-bottom: 8px;
    position: relative;
    padding: 8px 16px;
    cursor: auto;
  }

  .video .controls > :global(*) {
    opacity: 0;
    transition: opacity 0.25s;
    pointer-events: none;
  }

  :global(.hoverable):focus-within .controls > :global(*),
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
    top: -32px;
    left: 16px;
  }

  .video.advert .controls > :global(.advert-link) {
    position: absolute;
    right: 16px;
    top: -36px;
  }

  .video.advert.mobile .controls > :global(.time-indicator) {
    left: 8px;
  }

  .video.advert.mobile .controls > :global(.advert-link) {
    right: 8px;
  }

  .video.advert.fixed .controls > :global(.time-indicator) {
    left: 12px;
  }

  .video.advert.fixed .controls > :global(.advert-link) {
    right: 12px;
  }

  .video :global(.next-button) {
    margin-left: 8px;
  }

  .video.advert .controls {
    column-gap: 16px;
  }

  .video.stopped .controls {
    pointer-events: none;
    padding: 16px;
  }

  .video.stopped.right-to-left .controls {
    flex-direction: row-reverse;
  }

  .video.paused :global(.hoverable),
  .video.hovering :global(.hoverable) {
    background: rgba(0, 0, 0, 0.2);
  }

  .video.mobile .controls {
    padding: 8px;
  }

  .video.mobile .summary,
  .video.mobile .end {
    margin: 8px;
  }

  .video.fixed .scroll-to-player,
  .video.fixed .end {
    margin: 16px;
  }

  .video.fixed.mobile .scroll-to-player,
  .video.fixed.mobile .end {
    margin: 12px;
  }

  .video.fixed .controls {
    padding-left: 12px;
    padding-right: 12px;
  }

  :global(.beyondwords-player.maximized) .video {
    max-width: none;
    width: 100%;
    height: 100%;
  }

  :global(.beyondwords-player.maximized) .video :global(.hoverable) {
    padding: 0;
    height: 100%;
    background: none;
  }
</style>
