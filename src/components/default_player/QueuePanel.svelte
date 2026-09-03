<script>
  import formatTime from "../../helpers/formatTime";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import NowPlayingMarker from "../svg_icons/default_player/NowPlayingMarker.svelte";

  export let content = [];
  export let contentIndex = 0;
  export let summary = false;
  export let tokens;
  export let onEvent = () => {};

  let panel;

  $: activeRow = tokens.pressed;
  $: hoverRow = tokens.hover;

  const durationFor = (item) => (
    formatTime((summary ? item.summarization?.duration : item.duration) || 0)
  );

  const handleClick = (index) => () => {
    onEvent(newEvent({
      type: "PressedPlaylistItem",
      description: "A playlist item was pressed.",
      initiatedBy: "user",
      index,
    }));
  };

  // Arrow keys move focus through the queue rows.
  const handleKeydown = (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") { return; }
    event.preventDefault();

    const rows = [...panel.querySelectorAll("button.row")];
    const position = rows.indexOf(document.activeElement);
    const next = event.key === "ArrowDown" ? position + 1 : position - 1;

    rows[Math.max(0, Math.min(rows.length - 1, next))]?.focus();
  };
</script>

<ol class="queue" bind:this={panel}>
  {#each content as item, i (i)}
    <li class="queue-item">
      <button
        type="button"
        class="row"
        style="--bg: {i === contentIndex ? activeRow : "transparent"}; --hover-bg: {i === contentIndex ? activeRow : hoverRow}; outline-color: {tokens.text}"
        on:click={handleClick(i)}
        on:keydown={handleKeydown}
        on:mouseup={blurElement}
      >
        <span class="marker-slot">
          {#if i === contentIndex}
            <NowPlayingMarker size={16} color={tokens.icon} />
          {:else}
            <span class="index" style="color: {tokens.muted}">{i + 1}</span>
            <svg class="play-glyph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path fill={tokens.icon} d="M8.5 6.82 Q7.4 6.2 7.4 7.5 L7.4 16.5 Q7.4 17.8 8.5 17.18 L16.9 12.78 Q18.3 12 16.9 11.22Z" />
            </svg>
          {/if}
        </span>

        <span class="row-title" style="color: {tokens.text}">{item.title || ""}</span>
        <span class="duration" style="color: {tokens.muted}">{durationFor(item)}</span>
      </button>
    </li>
  {/each}
</ol>

<style>
  .queue {
    display: flex;
    flex-direction: column;
    padding: 6px 8px 8px;
    margin: 0;
    list-style: none;
  }

  .queue-item {
    display: block;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    flex-shrink: 0;
    padding: 0 8px;
    margin: 0;
    border: none;
    border-radius: 6px;
    background: var(--bg, transparent);
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .row:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: -2px;
  }

  .marker-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    flex-shrink: 0;
  }

  .index {
    font-size: 11px;
  }

  .play-glyph {
    display: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .row:hover {
      background: var(--hover-bg);
    }

    .row:hover .index {
      display: none;
    }

    .row:hover .play-glyph {
      display: block;
    }
  }

  .row-title {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .duration {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
</style>
