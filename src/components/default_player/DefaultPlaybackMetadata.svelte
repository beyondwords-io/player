<script lang="ts">
  import formatTime from "../../helpers/formatTime";
  import translate from "../../helpers/translate";
  import type { DefaultPlayerTokens } from "../../helpers/defaultPlayerTokens";
  import WifiSlash from "../svg_icons/default_player/WifiSlash.svelte";
  import ProgressTrack from "./ProgressTrack.svelte";

  export let accessCtaUrl: string | undefined = undefined;
  export let advertHref: string | undefined = undefined;
  export let advertText = "";
  export let buffering = false;
  export let currentTime = 0;
  export let duration = 0;
  export let hasVariants = false;
  export let isAdvert = false;
  export let isStopped = false;
  export let offline = false;
  export let onEvent: (event?: unknown) => void = () => {};
  export let openMenu: string | null = null;
  export let openVersionMenu: (event: MouseEvent) => void;
  export let playingTitle = "";
  export let progress = 0;
  export let showTierCta = false;
  export let stoppedTitle = "";
  export let tierCtaText = "";
  export let timeLabel = "";
  export let tokens: DefaultPlayerTokens;
  export let versionLabel = "";
</script>

<div class="title-col" class:playing={!isStopped}>
  {#if isStopped && showTierCta}
    {#if accessCtaUrl}
      <a class="title tier-cta" href={accessCtaUrl} target="_blank" rel="noopener noreferrer" style="color: {tokens.link}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}">{tierCtaText}</a>
    {:else}
      <span class="title" style="color: {tokens.text}">{tierCtaText}</span>
    {/if}
  {:else if isStopped}
    <span class="title" style="color: {tokens.text}">{stoppedTitle}</span>
    <span class="meta">
      {#if hasVariants}
        <button type="button" class="trigger" style="color: {tokens.muted}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}" on:click={openVersionMenu} aria-expanded={openMenu === "version"}>{versionLabel}</button>
      {:else}
        <span class="plain" style="color: {tokens.muted}">{versionLabel}</span>
      {/if}
    </span>
  {:else if isAdvert}
    <div class="title-row">
      {#if advertHref && advertText}
        <a class="advert-link" href={advertHref} target="_blank" rel="noopener noreferrer" style="color: {tokens.link}; outline-color: {tokens.text}">{advertText}</a>
      {:else}
        <span class="title playing" style="color: {tokens.text}">{playingTitle}</span>
      {/if}
      <span class="time" style="color: {tokens.muted}" role="status" aria-live="polite">{translate("timeLeft").replace("{time}", formatTime(Math.max(0, duration - currentTime)))}</span>
      <span class="ad-badge" style="color: {tokens.muted}; border-color: {tokens.underline}" role="img" aria-label={translate("advertisement")}>{translate("advertisementAbbreviation")}</span>
    </div>
    <ProgressTrack {progress} {duration} readonly={true} radius={tokens.radius.track} trackColor={tokens.track} fillColor={tokens.text} focusColor={tokens.text} {onEvent} />
  {:else if offline}
    <div class="title-row">
      {#if playingTitle}
        <span class="title playing" style="color: {tokens.muted}; opacity: 0.4">{playingTitle}</span>
      {/if}
      <span class="offline-note" style="color: {tokens.muted}">
        <WifiSlash size={12} color={tokens.muted} />
        {translate("offlineWillResume")}
      </span>
    </div>
    <ProgressTrack {progress} {duration} readonly={true} radius={tokens.radius.track} trackColor={tokens.track} fillColor={tokens.text} fillOpacity={0.4} focusColor={tokens.text} {onEvent} />
  {:else if playingTitle}
    <div class="title-row">
      <span class="title playing" style="color: {tokens.text}">{playingTitle}</span>
      <span class="time" style="color: {tokens.muted}">{timeLabel}</span>
    </div>
    <ProgressTrack {progress} {duration} {buffering} radius={tokens.radius.track} trackColor={tokens.track} fillColor={tokens.text} focusColor={tokens.text} {onEvent} />
  {:else}
    <div class="progress-row">
      <div class="progress-grow">
        <ProgressTrack {progress} {duration} {buffering} thickness={6} radius={tokens.radius.track} trackColor={tokens.track} fillColor={tokens.text} focusColor={tokens.text} {onEvent} />
      </div>
      <span class="time" style="color: {tokens.muted}">{timeLabel}</span>
    </div>
  {/if}
</div>

<style>
  .title-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    flex: 1;
    min-width: 100px;
  }

  .title-col.playing { gap: 7px; }

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

  .title-row,
  .progress-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .title-row { align-items: baseline; }

  .progress-grow {
    flex: 1;
    min-width: 40px;
  }

  .time {
    flex-shrink: 0;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .meta {
    display: flex;
    align-items: baseline;
    gap: 4px;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
  }

  .meta .trigger,
  .meta .plain {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .meta .trigger,
  .meta .plain {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title.tier-cta {
    width: fit-content;
    max-width: 100%;
    text-decoration: none;
    border-bottom-style: dotted;
    border-bottom-width: 1px;
    cursor: pointer;
  }

  .meta .trigger {
    padding: 0;
    margin: 0;
    background: none;
    border: none;
    border-bottom-width: 1px;
    border-bottom-style: dotted;
    cursor: pointer;
  }

  .meta .trigger:focus-visible,
  .advert-link:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .meta .trigger:hover { border-bottom-style: solid; }
  }

  .advert-link {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .ad-badge {
    flex-shrink: 0;
    padding: 2px 5px;
    border-width: 1px;
    border-style: solid;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .offline-note {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
</style>
