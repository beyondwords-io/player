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
  import CloseButton from "./buttons/CloseButton.svelte";
  import AdvertLink from "./external_links/AdvertLink.svelte";
  import BeyondWords from "./external_links/BeyondWords.svelte";
  import LargeImage from "./LargeImage.svelte";
  import PlayerTitle from "./titles/PlayerTitle.svelte";
  import PodcastTitle from "./titles/PodcastTitle.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import ProgressCircle from "./ProgressCircle.svelte";
  import TimeIndicator from "./time_indicators/TimeIndicator.svelte";
  import Playlist from "./Playlist.svelte";
  import Hoverable from "./helpers/Hoverable.svelte";
  import Visibility from "./helpers/Visibility.svelte";

  export let interfaceStyle = "standard";
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playerTitle = undefined;
  export let fixedPosition = undefined;
  export let fixedWidth = "auto";

  export let podcasts = [];
  export let podcastIndex = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let currentAdvert = undefined;

  export let isVisible = undefined;
  export let relativeY = undefined;
  export let absoluteY = undefined;
  export let onVisibilityChange = undefined;

  let width, isHovering;

  $: isSmall = interfaceStyle === "small";
  $: isStandard = interfaceStyle === "standard";
  $: isLarge = interfaceStyle === "large";
  $: isScreen = interfaceStyle === "screen";
  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";
  $: isLeft = fixedPosition === "left";
  $: isRight = fixedPosition === "right";
  $: isMobile = !isSmall && width < 380 || isScreen && width < 640;
  $: isAdvert = currentAdvert && !isStopped;

  $: podcast = podcasts[podcastIndex] || {};
  $: isPlaylist = podcasts.length > 1;
  $: duration = isAdvert ? currentAdvert.duration : podcast.duration;
  $: progress = isStopped ? 0 : currentTime / duration;

  $: widthStyle = fixedWidth === "auto" && isSmall ? "fit-content" : fixedWidth;
  $: position = fixedPosition === "auto" ? (isStandard ? "center" : "right") : fixedPosition;
  $: positionClass = position ? `fixed-${position}` : "";

  $: skipStyle = skipButtonStyle === "auto" ? (isPlaylist ? "tracks" : "segments") : skipButtonStyle;
  $: buttonScale = isSmall ? 0.8 : isScreen && !isMobile ? 2 : 1;
  $: playPauseScale = isScreen ? buttonScale * 1.5 : buttonScale;

  $: controlsOrder = isScreen                          ? "symmetrical"
                   : isLarge && isMobile               ? "symmetrical"
                   : isStandard && isLeft              ? "left-to-right"
                   : isStandard && isMobile            ? "right-to-left"
                   : isStandard && isRight && isAdvert ? "right-to-left"
                   : isStandard && isRight             ? "left-to-right-but-swap-ends"
                   : isSmall && isLeft                 ? "left-to-right"
                   : isSmall && isRight                ? "right-to-left"
                   :                                     "left-to-right";

  $: flyWidget = (e) => fixedPosition && fly(e, { y: isSmall || isStandard ? 40 : 100 });
  $: collapsed = isSmall && fixedPosition && !isAdvert && !isStopped && !isHovering;
</script>

<div class="user-interface {interfaceStyle} {positionClass} {controlsOrder}" style="width: {widthStyle}" class:mobile={isMobile} class:advert={isAdvert} class:collapsed bind:clientWidth={width} transition:flyWidget>
  <Hoverable bind:isHovering graceTime={500} enabled={isSmall && fixedPosition}>
    <div class="main">
      {#if isLarge || isScreen}
        <LargeImage src={isAdvert ? (currentAdvert.image || podcast.image) : podcast.image} scale={isScreen && !isMobile ? 1.5 : 1} />

        <div>
          <PlayerTitle title={playerTitle} visible={!isAdvert && !isScreen} {interfaceStyle} scale={isScreen ? 2 : 1} />
          <PodcastTitle title={podcast.title} maxLines={isMobile || isScreen ? 3 : 1} scale={isScreen ? 2 : 1} maxWidth={isScreen && !isMobile ? 40 : isScreen ? 20 : null} />
        </div>
      {/if}

      <div class="controls">
        <Visibility bind:isVisible bind:relativeY bind:absoluteY onChange={onVisibilityChange}>
          <ProgressCircle {progress} enabled={isScreen || isSmall && fixedPosition} bold={isSmall} scale={playPauseScale} color={isAdvert ? "#00cdbc" : "#323232"}>
            {#if isPlaying}
              <PauseButton scale={playPauseScale} />
            {:else}
              <PlayButton scale={playPauseScale} />
            {/if}
          </ProgressCircle>
        </Visibility>

        {#if isStandard && isStopped || isSmall}
          <PlayerTitle title="Listen to this article" visible={!isAdvert} {interfaceStyle} {collapsed} />
        {/if}

        {#if !isSmall && !isStopped && !isAdvert || (isScreen && isAdvert)}
          <SpeedButton scale={buttonScale} />
          <PrevButton style={skipStyle} scale={buttonScale} />
          <NextButton style={skipStyle} scale={buttonScale} />
        {/if}

        {#if isStandard && !isStopped && !isAdvert && width > 720 && controlsOrder !== "left-to-right-but-swap-ends"}
          <PodcastTitle title={podcast.title} maxLines={1} bold={true} scale={1.2} flex={0.52} />
        {/if}

        <TimeIndicator {currentTime} {duration} {interfaceStyle} {isAdvert} {isMobile} {isStopped} {positionClass} {collapsed} />

        {#if !isSmall && !isMobile && (!isStopped || isLarge) && !isScreen}
          <ProgressBar {progress} />
        {/if}

        {#if !isStopped}
          <SecondaryButton {interfaceStyle} {isMobile} {isAdvert} scale={buttonScale}>
            {#if isScreen && podcast.externalUrl}
              <NewTabButton scale={buttonScale} href={podcast.externalUrl} />
            {:else if isPlaylist && !fixedPosition}
              <PlaylistButton scale={buttonScale} />
            {/if}
          </SecondaryButton>
        {/if}

        {#if isAdvert}
          <AdvertLink href={currentAdvert.url} {interfaceStyle} scale={isScreen ? 2 : 1} />
          <AdvertButton href={currentAdvert.url} {interfaceStyle} scale={buttonScale} />
        {/if}
      </div>

      {#if !isAdvert && !(isSmall && fixedPosition) || isScreen}
        <div class="end">
          {#if fixedPosition}
            <CloseButton scale={isScreen && !isMobile ? 2.5 : isScreen ? 1.75 : 1} margin={isScreen && !isMobile ? "0.75rem 0" : isScreen ? "0.25rem 0" : "auto"} />
          {:else}
            <BeyondWords scale={isScreen && !isMobile ? 3 : isScreen ? 2 : 1} />
          {/if}
        </div>
      {/if}
    </div>
  </Hoverable>

  {#if !isSmall && !isScreen}
    <Playlist style={playlistStyle} podcasts={podcasts} index={podcastIndex} isMobile={isMobile} />
  {/if}
</div>

<style>
  .user-interface {
    overflow: hidden;
  }

  .user-interface :global(*) {
    font-family: "InterVariable", sans-serif;
    color: #323232;
  }

  .fixed-left, .fixed-center, .fixed-right {
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

  .controls {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    column-gap: 0.5rem;
    grid-row: 2;
    grid-column: 2 / span 2;
    min-width: 0;
    transition: column-gap 0.5s;
  }

  .collapsed .controls {
    column-gap: 0;
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
    border-radius: 0.375rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
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
</style>
