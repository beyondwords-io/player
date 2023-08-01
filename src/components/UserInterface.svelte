<script>
  import("../helpers/loadTheStyles.ts");
  import "@fontsource/inter/variable.css";
  import { fly } from "svelte/transition";
  import PlayPauseButton from "./buttons/PlayPauseButton.svelte";
  import PlaybackRateButton from "./buttons/PlaybackRateButton.svelte";
  import PrevButton from "./buttons/PrevButton.svelte";
  import NextButton from "./buttons/NextButton.svelte";
  import PlaylistButton from "./buttons/PlaylistButton.svelte";
  import SecondaryButtons from "./buttons/SecondaryButtons.svelte";
  import DownloadButton from "./buttons/DownloadButton.svelte";
  import MaximizeButton from "./buttons/MaximizeButton.svelte";
  import CloseWidgetButton from "./buttons/CloseWidgetButton.svelte";
  import AdvertLink from "./external_links/AdvertLink.svelte";
  import AdvertButton from "./external_links/AdvertButton.svelte";
  import BeyondWords from "./external_links/BeyondWords.svelte";
  import SourceUrlButton from "./external_links/SourceUrlButton.svelte";
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
  import { knownPlayerStyle } from "../helpers/playerStyles";
  import newEvent from "../helpers/newEvent";
  import translate from "../helpers/translate";
  import { canFullScreen } from "../helpers/fullScreen";

  export let playerStyle = "standard";
  export let callToAction = undefined;
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playlistToggle = "auto";
  export let downloadFormats = [];
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
  export let persistentAdvert = undefined;
  export let textColor = "#111";
  export let backgroundColor = "#f5f5f5";
  export let iconColor = "black";
  export let videoTextColor = "white";
  export let videoBackgroundColor = "black";
  export let videoIconColor = "white";
  export let logoIconEnabled = true;
  export let onEvent = () => {};

  // These are set automatically.
  export let videoIsBehind = false;
  export let isVisible = undefined;
  export let relativeY = undefined;
  export let absoluteY = undefined;
  let width, isHovering, timeout;

  $: isSmall = playerStyle === "small";
  $: isStandard = playerStyle === "standard";
  $: isLarge = playerStyle === "large";
  $: isScreen = playerStyle === "screen";
  $: isVideo = playerStyle === "video";
  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";
  $: isAdvert = activeAdvert && !isStopped;
  $: isPlaylist = content.length > 1;
  $: isMobile = belowBreakpoint({ playerStyle, width });

  $: contentItem = content[contentIndex] || {};
  $: progress = currentTime / duration;

  $: nonVideoTextColor = isAdvert && activeAdvert.textColor || textColor;
  $: nonVideoBgColor = isAdvert && activeAdvert.backgroundColor || backgroundColor;
  $: nonVideoIconColor = isAdvert && activeAdvert.iconColor || iconColor;

  $: activeTextColor = isVideo ? (isAdvert && activeAdvert.videoTextColor || videoTextColor) : nonVideoTextColor;
  $: activeBgColor = isVideo ? (isAdvert && activeAdvert.videoBackgroundColor || videoBackgroundColor) : nonVideoBgColor;
  $: activeIconColor = isVideo ? (isAdvert && activeAdvert.videoIconColor || videoIconColor) : nonVideoIconColor;

  $: skipStyle = skipButtonStyle === "auto" ? (isPlaylist ? "tracks" : "segments") : skipButtonStyle;

  $: buttonScale = isSmall || isVideo && fixedPosition ? 0.8 : isScreen && !isMobile ? 2 : 1;
  $: playPauseScale = buttonScale * (isScreen ? 1.5 : isVideo && isStopped ? 1.6 : 1);
  $: logoScale = isScreen && !isMobile ? 3 : isScreen ? 2 : isVideo && !isMobile ? 1.5 : 1;
  $: closeScale = isScreen && !isMobile ? 2.5 : isScreen ? 1.75 : isVideo && !isMobile ? 2 : isVideo ? 1.5 : 1;
  $: closeMargin = isScreen && !isMobile ? "12px 0" : isScreen ? "4px 0" : "auto";

  $: widthStyle = fixedWidth === "auto" ? (isSmall ? "fit-content" : "") : fixedWidth;
  $: position = fixedPosition === "auto" ? (isStandard ? "center" : "right") : fixedPosition;
  $: positionClasses = fixedPosition ? `fixed fixed-${position}` : "";
  $: flyWidget = (e) => fixedPosition && fly(e, { y: isSmall || isStandard ? 40 : 100 });

  $: controlsOrder = controlsOrderFn({ playerStyle, position, isMobile, isAdvert });

  $: largeImage = isAdvert && activeAdvert.imageUrl || !isStopped && persistentAdvert?.imageUrl ||  contentItem.imageUrl;
  $: largeImageHref = isAdvert && activeAdvert.clickThroughUrl || !isStopped && persistentAdvert?.clickThroughUrl;

  $: collapsible = isSmall && fixedPosition && fixedWidth === "auto";
  $: forcedCollapsed = isSmall && (fixedWidth === 0 || fixedWidth === "0");
  $: collapsed = forcedCollapsed || collapsible && !isAdvert && !isStopped && !isHovering;

  $: showCloseWidget = fixedPosition && !isSmall && !(isStandard && isAdvert);
  $: showBeyondWords = logoIconEnabled && (!isAdvert || isScreen) && !(fixedPosition && isSmall) && !forcedCollapsed;

  $: playlistParts = playlistStyle.split("-");

  $: showPlaylist = (playlistParts[0] === "show" || playlistParts[0] === "auto" && isPlaylist) && !isSmall;
  $: showPlaylistToggle = (playlistToggle === "show" || playlistToggle === "auto" && isPlaylist) && !isSmall;

  $: classes = `user-interface ${playerStyle} ${playbackState} ${positionClasses} ${controlsOrder}`;
  $: fixedPosition && animate();

  const animate = () => { // TODO: extract?
    if (timeout) { clearTimeout(timeout); }
    timeout = setTimeout(() => timeout = null, 500);
  };

  const handleMouseDown = (event) => {
    if (!isVideo) { return; }

    const isLeftClick = event.button === 0;
    if (!isLeftClick) { return; }

    const clickedOnMain = event.target.classList.contains("main");
    if (!clickedOnMain) { return; }

    onEvent(newEvent({
      type: "PressedVideoBackground",
      description: "The video background was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

{#if knownPlayerStyle(playerStyle) && content.length > 0}
  <div class={classes} style="width: {widthStyle}" class:mobile={isMobile} class:advert_={isAdvert} class:hovering={isHovering} class:collapsed bind:clientWidth={width} class:animating={timeout} transition:flyWidget on:outrostart={animate}>
    <Hoverable bind:isHovering exitDelay={collapsible ? 500 : 0} idleDelay={isVideo ? 1500 : Infinity}>
      {#if isVideo && !videoIsBehind}
        <div class="video-placeholder" />
      {/if}

      <div class="main" role="none" class:no-image={!largeImage} on:mousedown={handleMouseDown} on:keyup={null} style="background: {isVideo ? "transparent" : activeBgColor}">
        {#if largeImage && (isLarge || isScreen)}
          <LargeImage {onEvent} src={largeImage} href={largeImageHref} scale={isScreen && !isMobile ? 1.5 : 1} />
        {/if}

        {#if isLarge || isScreen}
          <div class="summary">
            <PlayerTitle title={playerTitle} visible={!isAdvert} {playerStyle} scale={isScreen ? 2 : 1} color={activeTextColor} />
            <ContentTitle title={contentItem.title} maxLines={isMobile || isScreen ? 3 : 1} center={isScreen} scale={isScreen ? 2 : 1} maxWidth={isScreen && !isMobile ? 640 : isScreen ? 320 : null} color={activeTextColor} />
          </div>
        {/if}

        <div class="controls">
          <Visibility {onEvent} enabled={!fixedPosition} bind:isVisible bind:relativeY bind:absoluteY>
            <ProgressCircle {onEvent} {progress} enabled={isScreen || isSmall} bold={isSmall} scale={playPauseScale} color={activeIconColor}>
              <PlayPauseButton {onEvent} {isPlaying} scale={playPauseScale} color={activeIconColor} />
            </ProgressCircle>
          </Visibility>

          {#if isStandard && isStopped || isSmall}
            <PlayerTitle title={callToAction || translate("listenToThisArticle")} visible={!isAdvert} {playerStyle} {collapsible} {collapsed} color={activeTextColor} />
          {/if}

          {#if !isSmall && !isStopped && !isAdvert || (isScreen && isAdvert)}
            <PlaybackRateButton {onEvent} rate={playbackRate} scale={buttonScale} color={activeTextColor} />
            <PrevButton {onEvent} style={skipStyle} scale={buttonScale} color={activeIconColor} />
            <NextButton {onEvent} style={skipStyle} scale={buttonScale} color={activeIconColor} />
          {/if}

          {#if isStandard && fixedPosition && !isStopped && !isAdvert && width > 720 && controlsOrder !== "left-to-right-but-swap-ends"}
            <ContentTitle title={contentItem.title} maxLines={1} bold={true} scale={1.2} flex={0.52} color={activeTextColor} />
          {/if}

          <TimeIndicator {currentTime} {duration} {playerStyle} {isAdvert} {isMobile} {isStopped} {positionClasses} {collapsed} {largeImage} color={activeTextColor} />

          {#if (isStandard && !isMobile && !isStopped) || (isLarge && !isMobile) || (isVideo && !isStopped)}
            <ProgressBar {onEvent} {progress} fullWidth={isVideo} readonly={isAdvert} color={activeIconColor} />
          {/if}

          {#if isAdvert && !forcedCollapsed}
            <AdvertLink {onEvent} href={activeAdvert.clickThroughUrl} {playerStyle} scale={isScreen && !isMobile ? 2 : isScreen ? 1.6 : 1} {controlsOrder} color={activeTextColor} {largeImage} {isMobile} />
            <AdvertButton {onEvent} href={activeAdvert.clickThroughUrl} {playerStyle} scale={buttonScale} {controlsOrder} color={activeIconColor} />
          {/if}

          {#if !isStopped}
            <SecondaryButtons {playerStyle} {isMobile} {isAdvert} scale={buttonScale}>
              {#if isScreen && contentItem.sourceUrl}
                <SourceUrlButton {onEvent} scale={buttonScale} href={contentItem.sourceUrl} color={activeIconColor} />
              {:else if showPlaylistToggle}
                <PlaylistButton {onEvent} scale={buttonScale} color={activeIconColor} playlistShowing={showPlaylist} {playerStyle} />
              {:else if !showPlaylist}
                <DownloadButton {onEvent} scale={logoScale} color={activeIconColor} {downloadFormats} {contentIndex} audio={contentItem?.audio} video={contentItem?.video} />
              {/if}

              {#if isVideo && canFullScreen()}
                <MaximizeButton {onEvent} scale={buttonScale} color={activeIconColor} />
              {/if}

              {#if isVideo && showBeyondWords}
                <BeyondWords {onEvent} scale={logoScale} visible={isScreen || isHovering || isPlaying} />
              {/if}
            </SecondaryButtons>
          {/if}
        </div>

        {#if showCloseWidget || showBeyondWords}
          <div class="end">
            {#if showCloseWidget}
              <CloseWidgetButton {onEvent} scale={closeScale} margin={closeMargin} color={activeIconColor} />
            {:else if !isVideo}
              <BeyondWords {onEvent} scale={logoScale} visible={isScreen || isHovering || isPlaying} />
            {/if}
          </div>
        {/if}
      </div>
    </Hoverable>

    {#if showPlaylist}
      <Playlist
        {onEvent}
        style={playlistStyle}
        {downloadFormats}
        larger={isScreen && !isMobile}
        {content}
        index={contentIndex}
        isMobile={isMobile}
        textColor={nonVideoTextColor}
        backgroundColor={nonVideoBgColor}
        iconColor={nonVideoIconColor} />
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
    position: relative;
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

  .end {
    grid-row: 1;
    grid-column: 3;
  }

  .collapsed .controls {
    column-gap: 0;
    transition: column-gap 1.25s;
  }

  .right-to-left .controls :global(.advert-button)        { order: 1; }
  .right-to-left .controls :global(.advert-link)          { order: 2; }
  .right-to-left .controls :global(.progress-bar)         { order: 3; }
  .right-to-left .controls :global(.player-title)         { order: 4; }
  .right-to-left .controls :global(.time-indicator)       { order: 5; }
  .right-to-left .controls :global(.prev-button)          { order: 6; }
  .right-to-left .controls :global(.next-button)          { order: 7; }
  .right-to-left .controls :global(.playback-rate-button) { order: 8; }
  .right-to-left .controls :global(.visibility)           { order: 9; }

  .symmetrical .controls :global(.prev-button)          { order: 1; }
  .symmetrical .controls :global(.playback-rate-button) { order: 2; }
  .symmetrical .controls :global(.visibility)           { order: 3; }
  .symmetrical .controls :global(.secondary-buttons)    { order: 4; }
  .symmetrical .controls :global(.next-button)          { order: 5; }

  .left-to-right-but-swap-ends .controls :global(.visibility) { order: 1; }

  .advert_ .controls {
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

  .large.advert_ .controls {
    justify-content: space-between;
  }

  .large .controls {
    align-self: flex-end;
  }

  .large.mobile .main {
    height: 144px;
  }

  .large .no-image .summary {
    grid-column: 1 / span 2;
  }

  .large .no-image .controls {
    grid-column: 1 / span 3;
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

  .small.left-to-right.advert_ .main {
    padding-right: 4px;
  }

  .small.right-to-left.advert_ .main {
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
    border-radius: 8px;
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
    margin-bottom: 90px;
  }

  .screen.advert_ .controls {
    margin-bottom: 232px;
  }

  .screen.mobile .controls {
    column-gap: 8px;
    margin-top: -8px;
    margin-bottom: 60px;
  }

  .screen.mobile.advert_ .controls {
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
    min-width: 300px;
    max-width: 720px;
    border-radius: 8px;
    transition: background-color 0.25s;
  }

  .video.advert_.playing,
  .video.advert_.playing :global(*) {
    pointer-events: none;
  }

  .video.advert_.playing .controls,
  .video.advert_.playing .controls :global(*),
  .video.advert_.playing .end,
  .video.advert_.playing .end :global(*),
  .video.advert_.playing :global(.playlist),
  .video.advert_.playing :global(.playlist *) {
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
  .video.hovering .main {
    cursor: default;
  }

  .video .summary {
    margin: 16px;
    cursor: auto;
    display: flex;
  }

  .video .end {
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

  .video .controls > :global(.progress-bar.full-width) {
    transition: opacity 0.25s, height 0.1s, top 0.1s;
  }

  :global(.video .hoverable):focus-within .controls > :global(*),
  :global(.video .hoverable):focus-within .end > :global(.beyondwords),
  .video.stopped .controls > :global(*),
  .video.hovering .controls > :global(*),
  .video.advert_ .controls > :global(.time-indicator),
  .video.advert_ .controls > :global(.advert-link) {
    opacity: 1;
    pointer-events: auto;
  }

  .video.advert_ .controls > :global(.time-indicator) {
    position: absolute;
    left: 16px;
    bottom: 16px;
    transition: bottom 0.5s;
  }

  .video.advert_ .controls > :global(.advert-link) {
    position: absolute;
    right: 16px;
    bottom: 16px;
    transition: bottom 0.5s;
  }

  :global(.video.advert_ .hoverable):focus-within .controls > :global(.time-indicator),
  .video.advert_.stopped .controls > :global(.time-indicator),
  .video.advert_.hovering .controls > :global(.time-indicator),
  :global(.video.advert_ .hoverable):focus-within .controls > :global(.advert-link),
  .video.advert_.stopped .controls > :global(.advert-link),
  .video.advert_.hovering .controls > :global(.advert-link) {
    bottom: 76px;
  }

  .video.advert_.mobile .controls > :global(.time-indicator) {
    left: 8px;
    margin-bottom: -4px;
  }

  .video.advert_.mobile .controls > :global(.advert-link) {
    right: 8px;
    margin-bottom: -4px;
  }

  .video.advert_.fixed .controls > :global(.time-indicator) {
    left: 12px;
  }

  .video.advert_.fixed .controls > :global(.advert-link) {
    right: 12px;
  }

  .video :global(.next-button) {
    margin-left: 8px;
  }

  .video.advert_ .controls {
    column-gap: 16px;
  }

  .video.stopped .controls {
    pointer-events: none;
    padding: 16px;
  }

  .video.stopped.right-to-left .controls {
    flex-direction: row-reverse;
  }

  .video.stopped :global(.hoverable),
  .video :global(.hoverable):focus-within,
  .video.hovering :global(.hoverable) {
    background: linear-gradient(
      rgba(0, 0, 0, 0)     50.0%,
      rgba(0, 0, 0, 0.083) 63.6%,
      rgba(0, 0, 0, 0.14)  67.55%,
      rgba(0, 0, 0, 0.207) 71.3%,
      rgba(0, 0, 0, 0.282) 74.8%,
      rgba(0, 0, 0, 0.36)  78.1%,
      rgba(0, 0, 0, 0.44)  81.25%,
      rgba(0, 0, 0, 0.518) 84.2%,
      rgba(0, 0, 0, 0.593) 87.05%,
      rgba(0, 0, 0, 0.66)  89.75%,
      rgba(0, 0, 0, 0.717) 92.4%,
      rgba(0, 0, 0, 0.761) 94.95%,
      rgba(0, 0, 0, 0.79)  97.5%,
      rgba(0, 0, 0, 0.8)   100.0%
    );
  }

  .video.fixed.stopped :global(.hoverable),
  .video.fixed :global(.hoverable):focus-within,
  .video.fixed.hovering :global(.hoverable) {
    background: linear-gradient(
      rgba(0, 0, 0, 0)     25.0%,
      rgba(0, 0, 0, 0.083) 45.4%,
      rgba(0, 0, 0, 0.14)  51.325%,
      rgba(0, 0, 0, 0.207) 56.95%,
      rgba(0, 0, 0, 0.282) 62.2%,
      rgba(0, 0, 0, 0.36)  67.15%,
      rgba(0, 0, 0, 0.44)  71.875%,
      rgba(0, 0, 0, 0.518) 76.3%,
      rgba(0, 0, 0, 0.593) 80.575%,
      rgba(0, 0, 0, 0.66)  84.625%,
      rgba(0, 0, 0, 0.717) 88.6%,
      rgba(0, 0, 0, 0.761) 92.425%,
      rgba(0, 0, 0, 0.79)  96.25%,
      rgba(0, 0, 0, 0.8)   100.0%
    );
  }

  :global(.beyondwords-player.maximized) .video.stopped :global(.hoverable),
  :global(.beyondwords-player.maximized) .video :global(.hoverable):focus-within,
  :global(.beyondwords-player.maximized) .video.hovering :global(.hoverable) {
    background: linear-gradient(
      rgba(0, 0, 0, 0)     75%,
      rgba(0, 0, 0, 0.083) 81.67%,
      rgba(0, 0, 0, 0.14)  83.67%,
      rgba(0, 0, 0, 0.207) 85.33%,
      rgba(0, 0, 0, 0.282) 87.33%,
      rgba(0, 0, 0, 0.36)  89.0%,
      rgba(0, 0, 0, 0.44)  90.33%,
      rgba(0, 0, 0, 0.518) 92.0%,
      rgba(0, 0, 0, 0.593) 93.33%,
      rgba(0, 0, 0, 0.66)  94.67%,
      rgba(0, 0, 0, 0.717) 96.0%,
      rgba(0, 0, 0, 0.761) 97.33%,
      rgba(0, 0, 0, 0.79)  98.67%,
      rgba(0, 0, 0, 0.8)   100.0%
    );
  }

  .video.mobile .controls {
    padding: 8px;
  }

  .video.mobile .summary,
  .video.mobile .end {
    margin: 8px;
  }

  .video.fixed .end {
    margin: 16px;
  }

  .video.fixed.mobile .end {
    margin: 12px;
  }

  .video.fixed .controls {
    padding-left: 12px;
    padding-right: 12px;
  }

  :global(.beyondwords-player.maximized) .fixed {
    display: none;
  }

  :global(.beyondwords-player.maximized) .video {
    max-width: none;
    width: 100%;
    height: 100%;
  }

  :global(.beyondwords-player.maximized) .video :global(.hoverable) {
    padding: 0;
    height: 100%;
  }
</style>
