<script lang="ts">
  import type { DefaultPlayerTokens } from "../../helpers/defaultPlayerTokens";
  import blurElement from "../../helpers/blurElement";
  import PauseCircle from "../svg_icons/default_player/PauseCircle.svelte";
  import PlayCircle from "../svg_icons/default_player/PlayCircle.svelte";

  export let label: string;
  export let onToggle: (event: MouseEvent) => void;
  export let playing = false;
  export let tokens: DefaultPlayerTokens;
</script>

<button
  type="button"
  class="play-pause"
  style="color: {tokens.icon}; outline-color: {tokens.text}"
  aria-label={label}
  on:click={onToggle}
  on:mouseup={blurElement}
>
  {#if playing}
    <PauseCircle size={40} color={tokens.icon} />
  {:else}
    <PlayCircle size={40} color={tokens.icon} />
  {/if}
</button>

<style>
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
    .play-pause:hover { transform: scale(1.04); }
  }

  .play-pause:active { transform: scale(0.96); }

  @media (prefers-reduced-motion: reduce) {
    .play-pause { transition: none; }
    .play-pause:hover,
    .play-pause:active { transform: none; }
  }
</style>
