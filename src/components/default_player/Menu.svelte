<script lang="ts">
  import { onMount } from "svelte";
  import type { DefaultPlayerTokens } from "../../helpers/defaultPlayerTokens";
  import Check from "../svg_icons/default_player/Check.svelte";

  interface MenuItem {
    value: string;
    label: string;
    secondary?: string;
    selected?: boolean;
    keepOpen?: boolean;
  }

  interface MenuGroup {
    label: string;
    items: MenuItem[];
  }

  // Small anchored menu per the design system: eyebrow label per group,
  // 13px items, selected row holds a tint and a check.
  export let groups: MenuGroup[] = [];
  export let left = 0;
  export let tokens: DefaultPlayerTokens;
  export let trigger: HTMLElement | undefined = undefined;
  export let onSelect: (item: MenuItem) => void = () => {};
  export let onClose: () => void = () => {};

  // Both measured against the player, which is the containing block. Anchoring
  // to the trigger rather than to the bottom of the player keeps the menu under
  // the control that opened it however tall the player has become - with the
  // queue open it was landing 160px below the bar.
  export let anchorTop = 0;
  export let anchorBottom = 0;

  let menu: HTMLDivElement;
  let top = anchorBottom + 6;

  onMount(() => {
    // Docked at the bottom of the window there is no room below the trigger,
    // and the items would be laid out past the edge of the screen where nothing
    // can click them, so hang the menu above it instead.
    const box = menu.getBoundingClientRect();
    if (box.bottom > window.innerHeight - 8) { top = anchorTop - box.height - 6; }

    const handlePointerDown = (event: MouseEvent) => {
      // A press on the trigger is the trigger's own to handle: it toggles the
      // menu shut. Closing it here as well would let the click that follows
      // re-open it, so the menu could never be dismissed from its trigger.
      const target = event.target as Node;
      const outside = !menu.contains(target) && !trigger?.contains(target);
      if (outside) { onClose(); }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
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
  style="left: {left}px; top: {top}px; background: {tokens.bubbleBackground}; border: 1px solid {tokens.divider}; border-radius: {tokens.radius.control}; box-shadow: {tokens.widgetShadow}"
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
