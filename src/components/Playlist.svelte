<script>
  import VolumeUp from "./svg_icons/VolumeUp.svelte";
  import PlaylistItemTitle from "./titles/PlaylistItemTitle.svelte";
  import DurationInMins from "./time_indicators/DurationInMins.svelte";
  import newEvent from "../helpers/newEvent";
  import blurElement from "../helpers/blurElement";

  export let style = "auto";
  export let playlist = [];
  export let index = 0;
  export let isMobile;
  export let onEvent;

  $: [mode, desktopRows, mobileRows] = style.split("-");

  $: mobileRows = mobileRows || desktopRows || 4;
  $: desktopRows = desktopRows || 5;

  const handleClick = (i) => () => {
    onEvent(newEvent({
      type: "PressedPlaylistItem",
      description: "A playlist item was pressed.",
      initiatedBy: "user",
      itemIndex: i,
    }));
  };

  const handleKeydown = (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.target.previousElementSibling.focus();
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.target.nextElementSibling.focus();
    }
  };

  const handleFocus = (event) => {
    const scrollable = event.target.parentNode;
    const nearestTen = Math.round(scrollable.scrollTop / 10) * 10;

    scrollable.scrollTop = nearestTen;
  };
</script>

{#if mode === "show" || mode === "auto" && playlist.length > 1}
  <div class="playlist" class:mobile={isMobile} style="--desktop-rows: {desktopRows}; --mobile-rows: {mobileRows}">
    <div class="scrollable">
      {#each playlist as { title, duration }, i}
        <button class="item" class:active={i === index} on:click={handleClick(i)} on:keydown={handleKeydown} on:focus={handleFocus} on:mouseup={blurElement}>
          {#if i === index}
            <span class="speaker"><VolumeUp /></span>
          {:else}
            <span class="number">{i + 1}</span>
          {/if}

          <span class="title">
            <PlaylistItemTitle {title} maxLines={isMobile ? 3 : 2} bold={i === index} />
          </span>

          <span class="duration">
            <DurationInMins {duration} bold={i === index} />
          </span>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .playlist {
    margin-top: 1rem;
    background: #fafafa;
    border-radius: 0.5rem;
  }

  .scrollable {
    padding: 0.2rem 0;
    padding-left: 0.25rem;
    overflow-y: scroll;
    max-height: calc(2.5rem * var(--desktop-rows));
  }

  .mobile .scrollable {
    padding-left: 0;
    max-height: calc(5rem * var(--mobile-rows));
  }

  .scrollable::-webkit-scrollbar {
    width: 0.5rem;
  }

  .scrollable::-webkit-scrollbar-thumb {
    background: #323232;
    border-radius: 1rem;
    border: 0.125rem solid #fafafa;
  }

  .item {
    width: 100%;
    height: 2.5rem;

    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto;
    align-items: center;
    column-gap: 0.5rem;

    font-size: 0.625rem;
    font-weight: 300;
    line-height: 1.2;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
    padding-right: 0.625rem;
    text-align: left;
    cursor: pointer;
  }

  .mobile .item {
    height: 5rem;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
    padding-right: 1rem;
  }

  .number,
  .speaker {
    width: 2.5rem;
    text-align: center;
    font-weight: 700;
    flex-shrink: 0;
  }

  .mobile .number,
  .mobile .speaker {
    grid-row: 1 / span 2;
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
    margin: 0.25rem 0;
    white-space: nowrap;
  }

  .mobile .duration {
    align-self: flex-start;
  }

  :global(.beyondwords-player.maximized) .playlist {
    display: none;
  }
</style>
