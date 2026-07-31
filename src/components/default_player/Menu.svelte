<script>
  import { onMount } from "svelte";
  import Check from "../svg_icons/default_player/Check.svelte";

  // Small anchored menu per the design system: eyebrow label per group,
  // 13px items, selected row holds a tint and a check.
  export let groups = []; // [{ label, items: [{ value, label, secondary, selected, keepOpen }] }]
  export let left = 0;
  export let tokens;
  export let trigger = undefined;
  export let onSelect = () => {};
  export let onClose = () => {};

  let menu;
  let placeAbove = false;

  onMount(() => {
    // Docked at the bottom of the window, there is no room below the bar: the
    // items would be laid out past the bottom of the viewport, where they
    // cannot be clicked at all.
    placeAbove = menu.getBoundingClientRect().bottom > window.innerHeight - 8;

    const handlePointerDown = (event) => {
      // A press on the trigger is the trigger's own to handle: it toggles the
      // menu shut. Closing it here as well would let the click that follows
      // re-open it, so the menu could never be dismissed from its trigger.
      const outside = !menu.contains(event.target) && !trigger?.contains(event.target);
      if (outside) { onClose(); }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") { onClose(); }
    };

    // Deferred so the opening click doesn't immediately close the menu.
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  });
</script>

<div
  bind:this={menu}
  class="menu"
  class:above={placeAbove}
  role="menu"
  style="left: {left}px; background: {tokens.bubbleBackground}; border: 1px solid {tokens.divider}; border-radius: {tokens.radius.control}; box-shadow: {tokens.widgetShadow}"
>
  {#each groups as group (group.label)}
    <span class="eyebrow" style="color: {tokens.muted}">{group.label}</span>

    {#each group.items as item (item.value)}
      <button
        type="button"
        role="menuitem"
        class="item"
        style="--bg: {item.selected ? tokens.hover : "transparent"}; --hover-bg: {tokens.pressed}; outline-color: {tokens.text}"
        on:click={() => { onSelect(item); if (!item.keepOpen) { onClose(); } }}
      >
        <span class="label" style="color: {tokens.text}">
          {item.label}
          {#if item.secondary}
            <span class="secondary" style="color: {tokens.muted}">· {item.secondary}</span>
          {/if}
        </span>

        {#if item.selected}
          <Check size={14} color={tokens.text} />
        {/if}
      </button>
    {/each}
  {/each}
</div>

<style>
  .menu {
    position: absolute;
    top: calc(100% + 6px);
    z-index: 10;
    /* Nothing in the bar should be able to take a press meant for the menu. */
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    min-width: 150px;
    max-width: 220px;
    padding: 6px;
    box-sizing: border-box;
  }

  .menu.above {
    top: auto;
    bottom: calc(100% + 6px);
  }

  .eyebrow {
    padding: 6px 10px 4px;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 10px;
    margin: 0;
    border: none;
    border-radius: 4px;
    background: var(--bg, transparent);
    cursor: pointer;
    text-align: left;
  }

  .item:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: -2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .item:hover {
      background: var(--hover-bg);
    }
  }

  .item .label {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item .secondary {
    font-size: 13px;
  }
</style>
