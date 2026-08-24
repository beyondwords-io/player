<script lang="ts">
  import blurElement from "../../helpers/blurElement";
  import type { DefaultPlayerTokens } from "../../helpers/defaultPlayerTokens";
  import translate from "../../helpers/translate";
  import Close from "../svg_icons/default_player/Close.svelte";
  import DotsThree from "../svg_icons/default_player/DotsThree.svelte";
  import Download from "../svg_icons/default_player/Download.svelte";
  import Info from "../svg_icons/default_player/Info.svelte";
  import LockSimple from "../svg_icons/default_player/LockSimple.svelte";
  import Queue from "../svg_icons/default_player/Queue.svelte";

  export let infoOpen = false;
  export let onClose: () => void;
  export let onDownload: () => void;
  export let onToggleInfo: () => void;
  export let onToggleOverflow: (event: MouseEvent) => void;
  export let onToggleQueue: () => void;
  export let overflowOpen = false;
  export let queueOpen = false;
  export let showClose = false;
  export let showDownload = false;
  export let showInfo = false;
  export let showOverflow = false;
  export let showQueue = false;
  export let showTierLock = false;
  export let tokens: DefaultPlayerTokens;
</script>

{#if showOverflow}
  <button
    type="button"
    class="icon-button"
    style="--bg: {overflowOpen ? tokens.pressed : "transparent"}; --hover-bg: {overflowOpen ? tokens.pressed : tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
    aria-label={translate("options")}
    aria-expanded={overflowOpen}
    on:click={onToggleOverflow}
    on:mouseup={blurElement}
  >
    <DotsThree size={18} color={tokens.icon} />
  </button>
{/if}

{#if showQueue}
  <button
    type="button"
    class="icon-button"
    style="--bg: {queueOpen ? tokens.pressed : "transparent"}; --hover-bg: {queueOpen ? tokens.pressed : tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
    aria-label={translate("togglePlaylist")}
    aria-expanded={queueOpen}
    on:click={onToggleQueue}
    on:mouseup={blurElement}
  >
    <Queue size={22} color={tokens.icon} />
  </button>
{/if}

{#if showDownload}
  <button
    type="button"
    class="icon-button"
    style="--hover-bg: {tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
    aria-label={translate("downloadAudio")}
    on:click={onDownload}
    on:mouseup={blurElement}
  >
    <Download size={22} color={tokens.icon} />
  </button>
{/if}

{#if showInfo}
  <button
    type="button"
    class="icon-button"
    style="--bg: {infoOpen ? tokens.pressed : "transparent"}; --hover-bg: {infoOpen ? tokens.pressed : tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
    aria-label={translate("aboutThisAudio")}
    aria-expanded={infoOpen}
    on:click={onToggleInfo}
    on:mouseup={blurElement}
  >
    <Info size={20} color={tokens.icon} />
  </button>
{/if}

{#if showTierLock}
  <span class="tier-lock" aria-hidden="true">
    <LockSimple size={16} color={tokens.muted} />
  </span>
{/if}

{#if showClose}
  <button
    type="button"
    class="icon-button"
    style="--hover-bg: {tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
    aria-label={translate("closeWidget")}
    on:click={onClose}
    on:mouseup={blurElement}
  >
    <Close size={14} color={tokens.muted} />
  </button>
{/if}

<style>
  .icon-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--bg, transparent);
    width: 28px;
    height: 28px;
    padding: 2px;
    margin: 0;
    border: none;
    cursor: pointer;
  }

  .icon-button::before {
    content: "";
    position: absolute;
    inset: -8px;
  }

  .icon-button:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .icon-button:hover { background: var(--hover-bg); }
  }

  .icon-button:active { background: var(--pressed-bg); }

  .tier-lock {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding: 0 8px;
  }
</style>
