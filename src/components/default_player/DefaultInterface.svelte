<!-- svelte-ignore unused-export-let -->
<script>
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";
  import deriveTokens from "../../helpers/default_theme/deriveTokens";
  import explicitOverrides from "../../helpers/default_theme/explicitOverrides";
  import PlayCircle from "../svg_icons/default_player/PlayCircle.svelte";
  import PauseCircle from "../svg_icons/default_player/PauseCircle.svelte";
  import ProgressTrack from "./ProgressTrack.svelte";
  import SkipButton from "./SkipButton.svelte";
  import SpeedButton from "./SpeedButton.svelte";

  export let onEvent = () => {};
  export let embedMode = "audio";
  export let theme = "light";
  export let radius = 8;
  export let content = [];
  export let contentIndex = 0;
  export let summary = false;
  export let duration = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let playbackRate = 1;
  export let playbackRates = [];
  export let skipButtonStyle = "auto";
  export let downloadFormats = [];
  export let playerTitle = undefined;
  export let callToAction = undefined;
  export let contentLanguage = "en";
  export let languages = [];
  export let textColor = undefined;
  export let backgroundColor = undefined;
  export let iconColor = undefined;
  export let highlightColor = undefined;
  export let wordHighlightColor = undefined;
  export let videoTextColor = undefined;
  export let videoIconColor = undefined;
  export let agentColor = undefined;
  export let agentAvatar = undefined;
  export let accentColor = undefined;
  export let accentTextColor = undefined;
  export let agentAccess = "full";
  export let agentLimit = undefined;
  export let agentVoice = true;
  export let agentPlaceholder = undefined;
  export let agentName = undefined;
  export let shortcuts = [];
  export let infoText = undefined;
  export let disclosureText = undefined;
  export let disclosureLink = undefined;
  export let logoIconEnabled = true;
  export let activeAdvert = undefined;
  export let activeIntroOrOutro = undefined;
  export let fixedPosition = undefined;
  export let fixedWidth = "auto";
  export let fixedMargin = "16px";
  export let showClose = false;

  $: overrides = explicitOverrides({
    textColor, backgroundColor, iconColor, highlightColor, wordHighlightColor,
    videoTextColor, videoIconColor, agentColor, agentAvatar, accentColor, accentTextColor,
  });

  $: tokens = deriveTokens({ theme, radius, overrides });
  $: displayBackground = overrides.backgroundColor || tokens.background;

  $: contentItem = content[contentIndex] || {};
  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";
  $: isPlaylist = content.length > 1;
  $: progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  $: skipStyle = skipButtonStyle === "auto" ? (isPlaylist ? "tracks" : "segments") : skipButtonStyle;

  $: stoppedTitle = callToAction || "Listen to this article";
  $: playingTitle = contentItem.title || playerTitle || stoppedTitle;

  $: totalMins = Math.max(1, Math.round(duration / 60));
  $: languageName = languageNameFor(contentLanguage);

  $: playPauseLabel = isPlaying ? translate("pauseAudio") : translate("playAudio");

  const languageNameFor = (code) => {
    const base = String(code || "en").split(/[-_]/)[0].toLowerCase();
    try {
      return new Intl.DisplayNames([base], { type: "language" }).of(base) || base;
    } catch {
      return base;
    }
  };

  const formatTime = (seconds) => {
    const whole = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(whole / 60);
    const secs = `${whole % 60}`.padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handlePlayPause = (event) => {
    event.preventDefault();
    const name = isPlaying ? "Pause" : "Play";

    onEvent(newEvent({
      type: `Pressed${name}`,
      description: `The ${name.toLowerCase()} button was pressed.`,
      initiatedBy: "user",
    }));
  };
</script>

<div
  class="default-player"
  class:dark={tokens.isDark}
  style="background: {displayBackground}; border-radius: {tokens.radius.bar}; box-shadow: {tokens.barRing};"
>
  <button
    type="button"
    class="play-pause"
    style="color: {tokens.icon}; outline-color: {tokens.text}"
    aria-label={playPauseLabel}
    on:click={handlePlayPause}
    on:mouseup={blurElement}
  >
    {#if isPlaying}
      <PauseCircle size={40} color={tokens.icon} />
    {:else}
      <PlayCircle size={40} color={tokens.icon} />
    {/if}
  </button>

  <div class="title-col" class:playing={!isStopped}>
    {#if isStopped}
      <span class="title" style="color: {tokens.text}">{stoppedTitle}</span>
      <span class="meta">
        <span class="trigger" style="color: {tokens.muted}; border-bottom-color: {tokens.underline}">{totalMins} min</span>
        <span class="separator" style="color: {tokens.muted}">·</span>
        <span class="trigger" style="color: {tokens.muted}; border-bottom-color: {tokens.underline}">{languageName}</span>
      </span>
    {:else}
      <div class="title-row">
        <span class="title playing" style="color: {tokens.text}">{playingTitle}</span>
        <span class="time" style="color: {tokens.text}">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
      <ProgressTrack
        {progress}
        {duration}
        trackColor={tokens.track}
        fillColor={tokens.text}
        focusColor={tokens.text}
        {onEvent} />
    {/if}
  </div>

  {#if !isStopped}
    <SkipButton
      direction="prev"
      style={skipStyle}
      color={tokens.icon}
      hoverBackground={tokens.hover}
      pressedBackground={tokens.pressed}
      focusColor={tokens.text}
      radius={tokens.radius.control}
      {onEvent} />

    <SkipButton
      direction="next"
      style={skipStyle}
      color={tokens.icon}
      hoverBackground={tokens.hover}
      pressedBackground={tokens.pressed}
      focusColor={tokens.text}
      radius={tokens.radius.control}
      {onEvent} />

    <SpeedButton
      rates={playbackRates}
      rate={playbackRate}
      color={tokens.text}
      hoverBackground={tokens.hover}
      pressedBackground={tokens.pressed}
      focusColor={tokens.text}
      radius={tokens.radius.control}
      {onEvent} />
  {/if}
</div>

<style>
  .default-player {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 56px;
    padding: 0 8px;
    box-sizing: border-box;
  }

  .default-player :global(*) {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  .play-pause {
    display: flex;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    padding: 0;
    margin: 0;
    background: none;
    border: none;
    cursor: pointer;
    transition: transform 150ms ease-out;
  }

  .play-pause:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 3px;
  }

  @media (hover: hover) and (pointer: fine) {
    .play-pause:hover {
      transform: scale(1.04);
    }
  }

  .play-pause:active {
    transform: scale(0.96);
  }

  .title-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .title-col.playing {
    gap: 7px;
  }

  .meta .trigger {
    border-bottom-width: 1px;
    border-bottom-style: dotted;
  }

  .title {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .title.playing {
    font-size: 13px;
    line-height: 1.2;
    flex: 1;
  }

  .title-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
  }

  .time {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .meta {
    display: flex;
    gap: 4px;
  }

  .meta span {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .separator {
    opacity: 0.5;
  }
</style>
