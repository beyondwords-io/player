<script>
  import "@fontsource/inter/variable.css";
  import PlayButton from "./buttons/PlayButton.svelte";
  import PauseButton from "./buttons/PauseButton.svelte";
  import PlaybackSpeed from "./buttons/PlaybackSpeed.svelte";
  import SkipButtons from "./buttons/SkipButtons.svelte";
  import AdvertButton from "./buttons/AdvertButton.svelte";
  import CloseButton from "./buttons/CloseButton.svelte";
  import AdvertLink from "./external_links/AdvertLink.svelte";
  import BeyondWords from "./external_links/BeyondWords.svelte";
  import LargeImage from "./LargeImage.svelte";
  import PlayerTitle from "./PlayerTitle.svelte";
  import PodcastTitle from "./PodcastTitle.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import TimeIndicator from "./time_indicators/TimeIndicator.svelte";
  import Playlist from "./Playlist.svelte";
  import Visibility from "./helpers/Visibility.svelte";

  export let interfaceStyle = "standard";
  export let skipButtonsStyle = "segments";
  export let playlistStyle = "auto-5-4";
  export let playerTitle = undefined;
  export let fixedPosition = undefined;

  export let podcasts = [];
  export let podcastIndex = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let currentAdvert = undefined;

  export let isVisible = undefined;
  export let relativeY = undefined;
  export let absoluteY = undefined;
  export let onVisibilityChange = undefined;

  let width;

  $: isStandard = interfaceStyle === "standard";
  $: isPodcast = interfaceStyle === "podcast";
  $: isIcon = interfaceStyle === "icon";

  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";

  $: isMobile = width < 380 && !isIcon;
  $: isAdvert = currentAdvert && !isStopped;
  $: iconScale = isIcon ? 0.8 : 1;

  $: podcast = podcasts[podcastIndex] || {};
  $: duration = isAdvert ? currentAdvert.duration : podcast.duration;

  $: position = fixedPosition ? `fixed-${fixedPosition}` : "";
</script>

<div class="user-interface {interfaceStyle} {position}" class:mobile={isMobile} class:advert={isAdvert} bind:clientWidth={width}>
  <div class="main">
    {#if isPodcast}
      <LargeImage src={isAdvert ? (currentAdvert.image || podcast.image) : podcast.image} />

      <div>
        <PlayerTitle title={isAdvert ? "" : playerTitle} {interfaceStyle} />
        <PodcastTitle title={podcast.title} maxLines={isMobile ? 3 : 1} />
      </div>
    {/if}

    <div class="controls">
      <Visibility bind:isVisible bind:relativeY bind:absoluteY onChange={onVisibilityChange}>
        {#if isPlaying}
          <PauseButton scale={iconScale} />
        {:else}
          <PlayButton scale={iconScale} />
        {/if}
      </Visibility>

      {#if isStandard && isStopped || isIcon && !isAdvert}
        <PlayerTitle title="Listen to this article" {interfaceStyle} />
      {/if}

      {#if !isIcon && !isStopped && !isAdvert}
        <PlaybackSpeed />
        <SkipButtons style={skipButtonsStyle} />
      {/if}

      <TimeIndicator {currentTime} {duration} {interfaceStyle} {isAdvert} {isMobile} {isStopped} />

      {#if !isIcon && !isMobile && (!isStopped || isPodcast)}
        <div class="progress-bar">
          <ProgressBar progress={isStopped ? 0 : currentTime / duration} />
        </div>
      {/if}

      {#if isAdvert}
        <AdvertLink href={currentAdvert.url} {interfaceStyle} />
        <AdvertButton href={currentAdvert.url} scale={iconScale} />
      {/if}
    </div>

    {#if !isAdvert}
      <div class="end">
        {#if fixedPosition}
          <CloseButton />
        {:else}
          <BeyondWords />
        {/if}
      </div>
    {/if}
  </div>

  {#if !isIcon}
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
    bottom: 1rem;
  }

  .fixed-left {
    left: 1rem;
  }

  .fixed-center {
    left: 1rem;
    width: calc(100% - 2rem);
  }

  .fixed-right {
    right: 1rem;
  }

  .main {
    box-sizing: border-box;
    background: #fafafa;
    column-gap: 0.5rem;
  }

  .controls {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    column-gap: 0.5rem;
    grid-row: 2;
    grid-column: 2 / span 2;
  }

  .progress-bar {
    flex-grow: 1;
  }

  .advert .controls {
    justify-content: space-between;
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

  .standard .progress-bar {
    margin-right: 0.5rem;
  }

  .standard.advert .progress-bar {
    margin-right: 0;
  }

  .standard .end {
    margin-right: 0.75rem;
  }

  .standard.mobile .main,
  .standard.mobile .controls {
    flex-direction: row-reverse;
  }

  .standard.fixed-left .main,
  .standard.fixed-left .controls {
    flex-direction: row;
  }

  .standard.mobile .end {
    margin-left: 0.75rem;
    margin-right: 0;
  }

  .standard.fixed-left .end {
    margin-left: 0;
    margin-right: 0.75rem;
  }

  .podcast {
    min-width: 300px;
  }

  .podcast .main {
    height: 6rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .podcast.mobile .main {
    height: 9rem;
  }

  .podcast.mobile .controls {
    flex-direction: row-reverse;
    grid-row: 3;
    grid-column: 1 / span 3;
  }

  .icon {
    min-width: 200px;
    max-width: 200px;
  }

  .icon .main {
    height: 2.5rem;
    padding: 0.25rem;
    border-radius: 1.25rem;
    display: flex;
    align-items: center;
  }

  .icon.fixed-right .main,
  .icon.fixed-right .controls {
    flex-direction: row-reverse;
  }

  .icon .end {
    margin-right: 0.5rem;
  }

  .icon.fixed-right .end {
    margin-left: 0.5rem;
    margin-right: 0;
  }
</style>
