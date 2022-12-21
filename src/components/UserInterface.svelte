<script>
  import "@fontsource/inter/variable.css";
  import PlayButton from "./buttons/PlayButton.svelte";
  import PauseButton from "./buttons/PauseButton.svelte";
  import SpeedButton from "./buttons/SpeedButton.svelte";
  import SkipButtons from "./buttons/SkipButtons.svelte";
  import NewTabButton from "./buttons/NewTabButton.svelte";
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
  import Visibility from "./helpers/Visibility.svelte";

  export let interfaceStyle = "standard";
  export let skipButtonsStyle = "segments";
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

  let width;

  $: isStandard = interfaceStyle === "standard";
  $: isPodcast = interfaceStyle === "podcast";
  $: isIcon = interfaceStyle === "icon";
  $: isUrl = interfaceStyle === "url";

  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";

  $: isMobile = width < 380 && !isIcon;
  $: isAdvert = currentAdvert && !isStopped;

  $: externalUrl = isAdvert ? currentAdvert.url : isUrl ? podcast.externalUrl : "";
  $: buttonScale = isIcon ? 0.8 : isUrl ? 2 : 1;
  $: playPauseScale = isUrl ? 3 : buttonScale;

  $: podcast = podcasts[podcastIndex] || {};
  $: duration = isAdvert ? currentAdvert.duration : podcast.duration;
  $: progress = isStopped ? 0 : currentTime / duration

  $: position = fixedPosition ? `fixed-${fixedPosition}` : "";
  $: widthStyle = fixedWidth == "auto" && isIcon ? "fit-content" : fixedWidth;
</script>

<div class="user-interface {interfaceStyle} {position}" style="width: {widthStyle}" class:mobile={isMobile} class:advert={isAdvert} bind:clientWidth={width}>
  <div class="main">
    {#if isPodcast || isUrl}
      <LargeImage src={isAdvert ? (currentAdvert.image || podcast.image) : podcast.image} scale={isUrl ? 1.5 : 1} />

      <div>
        <PlayerTitle title={isAdvert || isUrl ? "" : playerTitle} {interfaceStyle} scale={isUrl ? 2 : 1} />
        <PodcastTitle title={podcast.title} maxLines={isMobile ? 3 : 1} scale={isUrl ? 2 : 1} />
      </div>
    {/if}

    <div class="controls">
      <Visibility bind:isVisible bind:relativeY bind:absoluteY onChange={onVisibilityChange}>
        <ProgressCircle enabled={isUrl} {progress} scale={playPauseScale} color={isAdvert ? "#00cdbc" : "#323232"}>
          {#if isPlaying}
            <PauseButton scale={playPauseScale} />
          {:else}
            <PlayButton scale={playPauseScale} />
          {/if}
        </ProgressCircle>
      </Visibility>

      {#if isStandard && isStopped || isIcon && !isAdvert}
        <PlayerTitle title="Listen to this article" {interfaceStyle} />
      {/if}

      {#if !isIcon && !isStopped && !isAdvert}
        <SpeedButton scale={buttonScale} />
        <SkipButtons style={skipButtonsStyle} scale={buttonScale} />
      {/if}

      {#if isStandard && !isStopped && !isAdvert && width > 700}
        <PodcastTitle title={podcast.title} maxLines={1} bold={true} scale={1.2} flex={0.52} />
      {/if}

      <TimeIndicator {currentTime} {duration} {interfaceStyle} {isAdvert} {isMobile} {isStopped} {position} />

      {#if !isIcon && !isMobile && (!isStopped || isPodcast)}
        <ProgressBar {progress} marginRight={isStandard && !isAdvert ? 0.5 : 0} />
      {/if}

      {#if isAdvert}
        <AdvertLink href={currentAdvert.url} {interfaceStyle} scale={isUrl ? 2 : 1} />
      {/if}

      {#if externalUrl}
        <NewTabButton href={externalUrl} {interfaceStyle} scale={buttonScale} color={isAdvert ? "#00cdbc" : "#323232"} />
      {/if}
    </div>

    {#if !isAdvert && !(isIcon && fixedPosition) || isUrl}
      <div class="end">
        {#if fixedPosition}
          <CloseButton scale={isUrl ? 2.5 : 1} margin={isUrl ? "0.75rem 0" : "auto"} />
        {:else}
          <BeyondWords scale={isUrl ? 3.375 : 1} />
        {/if}
      </div>
    {/if}
  </div>

  {#if !isIcon && !isUrl}
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
  }

  .controls {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    column-gap: 0.5rem;
    grid-row: 2;
    grid-column: 2 / span 2;
    overflow: hidden;
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

  .standard .end {
    margin-right: 0.75rem;
  }

  .standard.mobile .main,
  .standard.mobile .controls,
  .standard.fixed-right .main,
  .standard.fixed-right .controls {
    flex-direction: row-reverse;
  }

  .standard.fixed-left .main,
  .standard.fixed-left .controls {
    flex-direction: row;
  }

  .standard.mobile .end,
  .standard.fixed-right .end {
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

  .podcast .controls {
    align-self: flex-end;
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
    min-width: 40px;
  }

  .icon.advert {
    min-width: 200px;
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

  .icon.fixed-right .main {
    padding-left: 0.5rem;
  }

  .icon.fixed-left .main {
    padding-right: 0.5rem;
  }

  .icon.fixed-right.advert .main {
    padding-left: 0.25rem;
  }

  .icon.fixed-left.advert .main {
    padding-right: 0.25rem;
  }

  .url .main {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    row-gap: 2.5rem;
    padding: 2.5rem;
    height: 756px;
  }

  .url .controls {
    flex-grow: 0;
    justify-content: center;
  }

  .url .end {
    order: -1;
    align-self: flex-end;
    margin-bottom: -2rem;
  }
</style>
