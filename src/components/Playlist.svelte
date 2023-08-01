<script>
  import VolumeUp from "./svg_icons/VolumeUp.svelte";
  import ContentTitle from "./titles/ContentTitle.svelte";
  import DownloadButton from "./buttons/DownloadButton.svelte";
  import DurationInMins from "./time_indicators/DurationInMins.svelte";
  import newEvent from "../helpers/newEvent";
  import blurElement from "../helpers/blurElement";

  export let style = "auto";
  export let downloadFormats = [];
  export let larger = false;
  export let textColor = "#111";
  export let backgroundColor = "#f5f5f5";
  export let iconColor = "#000";
  export let content = [];
  export let index = 0;
  export let isMobile;
  export let onEvent;

  $: parts = style.split("-");

  $: desktopRows = parts[1] || 5;
  $: mobileRows = parts[2] || parts[1] || 4;

  $: scale = larger ? 1.25 : 1;

  const handleClick = (i) => () => {
    onEvent(newEvent({
      type: "PressedPlaylistItem",
      description: "A playlist item was pressed.",
      initiatedBy: "user",
      index: i,
    }));
  };

  const handleKeydown = (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevItem = event.target.previousElementSibling;

      if (prevItem) { prevItem.focus(); }
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextItem = event.target.nextElementSibling;

      if (nextItem) { nextItem.focus(); }
    }
  };

  const handleFocus = (event) => {
    const scrollable = event.target.parentNode;
    const nearestTen = Math.round(scrollable.scrollTop / 10) * 10;

    scrollable.scrollTop = nearestTen;
  };
</script>

<div class="playlist" class:mobile={isMobile} class:larger style="--desktop-rows: {desktopRows}; --mobile-rows: {mobileRows}; background: {backgroundColor}">
  <div class="scrollable" tabindex="-1">
    {#each content as { title, duration, audio, video }, i}
      <button type="button" class="item" class:active={i === index} on:click={handleClick(i)} on:keydown={handleKeydown} on:focus={handleFocus} on:mouseup={blurElement} aria-label={title}>
        {#if i === index}
          <span class="speaker"><VolumeUp color={iconColor} {scale} /></span>
        {:else}
          <span class="number" style="color: {textColor}" aria-hidden="true">{i + 1}</span>
        {/if}

        <span class="title">
          <ContentTitle {title} {scale} maxLines={isMobile ? 3 : 2} bold={i === index} color={textColor} />
        </span>

        <span class="download">
          <DownloadButton {onEvent} color={iconColor} {downloadFormats} contentIndex={i} {audio} {video} />
        </span>

        <span class="duration">
          <DurationInMins {duration} {scale} bold={i === index} color={textColor} />
        </span>
      </button>
    {/each}
  </div>
</div>

<style>
  .playlist {
    margin-top: 16px;
    border-radius: 8px;
  }

  .scrollable {
    padding: 3.2px 0;
    padding-left: 4px;
    overflow-x: hidden;
    overflow-y: scroll;
    max-height: calc(40px * var(--desktop-rows));
  }

  .larger .scrollable {
    padding-top: 4px;
    padding-bottom: 4px;
    padding-left: 8px;
    max-height: calc(50px * var(--desktop-rows));
  }

  .mobile .scrollable {
    padding-left: 0;
    max-height: calc(80px * var(--mobile-rows));
  }

  .scrollable::-webkit-scrollbar {
    width: 8px;
  }

  .scrollable::-webkit-scrollbar-thumb {
    background: #323232;
    border-radius: 16px;
    border: 2px solid #fafafa;
  }

  .item {
    width: 100%;
    height: 40px;

    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto 30px;
    grid-template-rows: auto;
    align-items: center;
    column-gap: 8px;

    font-size: 10px;
    font-weight: 300;
    line-height: 1.2;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
    padding-right: 10px;
    box-sizing: border-box;
    text-align: left;
    cursor: pointer;
  }

  .larger .item {
    height: 50px;
  }

  .item:hover :global(.content-title) {
    font-weight: 500;
  }

  .item:hover :global(.duration-in-mins) {
    font-weight: 700;
  }

  .mobile .item {
    height: 80px;
    grid-template-rows: auto auto;
    padding-right: 16px;
  }

  .number,
  .speaker {
    width: 40px;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .larger .number,
  .larger .speaker {
    font-size: 12.5px;
  }

  .mobile .number,
  .mobile .speaker {
    grid-row: 1 / span 2;
  }

  .mobile .title {
    grid-column: 2 / span 2;
  }

  .active .title {
    font-weight: 700;
  }

  .title {
    flex-grow: 1;
  }

  .mobile .title {
    align-self: flex-end;
  }

  .duration {
    margin: 4px 0;
    white-space: nowrap;
    display: flex;
    justify-content: flex-end;
  }

  .larger .duration {
    margin: 8px 0;
  }

  .mobile .duration {
    grid-row: 2;
    grid-column: 2;
    justify-content: flex-start;
    align-self: flex-start;
  }

  .mobile .download {
    grid-row: 1 / span 2;
    grid-column: 4;
    justify-self: flex-end;
    align-self: center;
    position: relative;
    top: -2px;
  }

  :global(.beyondwords-player.maximized) .playlist {
    display: none;
  }
</style>
