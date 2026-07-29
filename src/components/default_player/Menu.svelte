<script>
  import { onMount } from "svelte";
  import Check from "../svg_icons/default_player/Check.svelte";

  // Small anchored menu per the design system: eyebrow label per group,
  // 13px items, selected row holds a tint and a check.
  export let groups = []; // [{ label, items: [{ value, label, secondary, selected, keepOpen }] }]
  export let left = 0;
  export let tokens;
  export let onSelect = () => {};
  export let onClose = () => {};

  let menu;

  onMount(() => {
    const handlePointerDown = (event) => {
      if (menu && !menu.contains(event.target)) { onClose(); }
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
        style="--hover-bg: {tokens.hover}; background: {item.selected ? tokens.hover : "none"}; outline-color: {tokens.text}"
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
    display: flex;
    flex-direction: column;
    min-width: 150px;
    max-width: 220px;
    padding: 6px;
    box-sizing: border-box;
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
    background: none;
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
