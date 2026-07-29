<script>
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";
  import Hoverable from "../helpers/Hoverable.svelte";
  import PlayCircle from "../svg_icons/default_player/PlayCircle.svelte";
  import PauseCircle from "../svg_icons/default_player/PauseCircle.svelte";
  import CornersOut from "../svg_icons/default_player/CornersOut.svelte";
  import CaretDown from "../svg_icons/default_player/CaretDown.svelte";
  import Orb from "./Orb.svelte";
  import ProgressTrack from "./ProgressTrack.svelte";

  // The design's video treatment: no bar - the same control anatomy overlays
  // the frame in white over a fixed black gradient, appearing on hover and
  // while not playing.
  export let tokens;
  export let aspectRatio = 16 / 9;
  export let playbackState = "stopped";
  export let duration = 0;
  export let currentTime = 0;
  export let title = "";
  export let showChat = false;
  export let chatOpen = false;
  export let onToggleChat = () => {};
  export let onEvent = () => {};

  let isHovering = false;

  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";
  $: vertical = aspectRatio < 1;
  $: controlsVisible = isHovering || !isPlaying || chatOpen;
  $: progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  $: whiteTrack = "rgba(255, 255, 255, 0.3)";

  const formatTime = (seconds) => {
    const whole = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(whole / 60)}:${`${whole % 60}`.padStart(2, "0")}`;
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

  const handleMaximize = () => {
    onEvent(newEvent({
      type: "PressedMaximize",
      description: "The maximize video button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<div class="video-frame" style="--aspect-ratio: {aspectRatio}; border-radius: {chatOpen ? `${tokens.radius.bar} ${tokens.radius.bar} 0 0` : tokens.radius.bar}">
  <Hoverable bind:isHovering idleDelay={1500}>
    <div class="frame-box">
      <div class="gradient" class:visible={controlsVisible} class:vertical></div>

      <div class="controls" class:visible={controlsVisible} class:vertical>
        {#if vertical}
          <span class="v-title" style="color: {tokens.videoText}">{title}</span>
          <ProgressTrack {progress} {duration} radius={tokens.radius.track} trackColor={whiteTrack} fillColor={tokens.videoText} focusColor={tokens.videoText} {onEvent} />
          <div class="v-row">
            <button type="button" class="overlay-button" aria-label={isPlaying ? translate("pauseAudio") : translate("playAudio")} on:click={handlePlayPause} on:mouseup={blurElement}>
              {#if isPlaying}<PauseCircle size={32} color={tokens.videoIcon} />{:else}<PlayCircle size={32} color={tokens.videoIcon} />{/if}
            </button>
            <span class="time" style="color: {tokens.videoText}">{formatTime(currentTime)} / {formatTime(duration)}</span>
            {#if showChat}
              <button type="button" class="overlay-button" aria-label="Chat about this video" aria-expanded={chatOpen} on:click={onToggleChat} on:mouseup={blurElement}>
                <Orb size={24} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} />
              </button>
            {/if}
          </div>
        {:else}
          <button type="button" class="overlay-button play" aria-label={isPlaying ? translate("pauseAudio") : translate("playAudio")} on:click={handlePlayPause} on:mouseup={blurElement}>
            {#if isPlaying}<PauseCircle size={40} color={tokens.videoIcon} />{:else}<PlayCircle size={isStopped ? 44 : 40} color={tokens.videoIcon} />{/if}
          </button>

          <div class="title-col">
            <div class="title-row">
              <span class="title" style="color: {tokens.videoText}">{title}</span>
              <span class="time" style="color: {tokens.videoText}">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <ProgressTrack {progress} {duration} radius={tokens.radius.track} trackColor={whiteTrack} fillColor={tokens.videoText} focusColor={tokens.videoText} {onEvent} />
          </div>

          <button type="button" class="overlay-button" aria-label={translate("maximizeVideo")} on:click={handleMaximize} on:mouseup={blurElement}>
            <CornersOut size={18} color={tokens.videoIcon} />
          </button>

          {#if showChat}
            <div class="v-divider"></div>
            <button type="button" class="overlay-chat" aria-label="Chat about this video" aria-expanded={chatOpen} on:click={onToggleChat} on:mouseup={blurElement}>
              <Orb size={22} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} />
              <span class="chat-label" style="color: {tokens.videoText}">Chat</span>
              <span class="chat-caret" class:flipped={chatOpen}>
                <CaretDown size={14} color="#dbdbdb" />
              </span>
            </button>
          {/if}
        {/if}
      </div>
    </div>
  </Hoverable>
</div>

<style>
  .video-frame {
    position: relative;
    overflow: hidden;
    background: #000;
  }

  .frame-box {
    position: relative;
    width: 100%;
    padding-bottom: calc(100% / var(--aspect-ratio));
  }

  .gradient {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 200ms ease-out;
    background: linear-gradient(rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.28) 75%, rgba(0, 0, 0, 0.62) 100%);
    pointer-events: none;
  }

  .gradient.vertical {
    background: linear-gradient(rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.3) 80%, rgba(0, 0, 0, 0.65) 100%);
  }

  .gradient.visible {
    opacity: 1;
  }

  .controls {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    box-sizing: border-box;
    opacity: 0;
    transition: opacity 200ms ease-out;
  }

  .controls.visible {
    opacity: 1;
  }

  .controls.vertical {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px;
  }

  .v-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .v-title {
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .overlay-button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 2px;
    margin: 0;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .overlay-button:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .overlay-button:hover {
      opacity: 0.85;
    }
  }

  .title-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 7px;
    flex: 1;
    min-width: 0;
  }

  .title-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
  }

  .title {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .time {
    flex-shrink: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .v-divider {
    width: 1px;
    height: 28px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.25);
  }

  .overlay-chat {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding: 8px 10px;
    margin: 0;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .overlay-chat:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .overlay-chat:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }

  .chat-label {
    font-size: 13px;
    font-weight: 500;
  }

  .chat-caret {
    display: flex;
    transition: transform 160ms ease-out;
  }

  .chat-caret.flipped {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .gradient,
    .controls,
    .chat-caret {
      transition: none;
    }
  }

  :global(.beyondwords-player.maximized) .video-frame {
    width: 100%;
    height: 100%;
  }
</style>
