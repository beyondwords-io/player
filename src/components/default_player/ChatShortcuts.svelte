<script lang="ts">
  import translate from "../../helpers/translate";
  import blurElement from "../../helpers/blurElement";
  import type { DefaultPlayerTokens } from "../../helpers/defaultPlayerTokens";

  export let empty = false;
  export let onSelect: (question: string) => void;
  export let open = false;
  export let questions: string[] = [];
  export let tokens: DefaultPlayerTokens;
</script>

{#if empty && open}
  <div class="empty-chips">
    {#each questions as question (question)}
      <button
        type="button"
        class="chip"
        style="--bg: {tokens.bubbleBackground}; --hover-bg: {tokens.hover}; --pressed-bg: {tokens.pressed}; color: {tokens.bubbleText}; outline-color: {tokens.text}"
        on:click={() => onSelect(question)}
        on:mouseup={blurElement}
      >{question}</button>
    {/each}
  </div>
{:else if open && questions.length > 0}
  <div class="shortcuts" style="background: {tokens.background}; border-radius: {tokens.radius.bar}; box-shadow: {tokens.widgetShadow}">
    <span class="eyebrow" style="color: {tokens.muted}">{translate("shortcuts")}</span>
    {#each questions as question (question)}
      <button type="button" class="shortcut-row" style="--hover-bg: {tokens.hover}; outline-color: {tokens.text}" on:click={() => onSelect(question)}>
        <span class="question" style="color: {tokens.text}">{question}</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .shortcuts {
    display: flex;
    flex-direction: column;
    margin: 0 12px 12px;
    padding: 6px;
  }

  .eyebrow {
    padding: 6px 10px 4px;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .shortcut-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 7px 10px;
    margin: 0;
    border: none;
    border-radius: 4px;
    background: none;
    cursor: pointer;
    text-align: left;
  }

  .shortcut-row:focus-visible,
  .chip:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .shortcut-row:hover { background: var(--hover-bg); }
    .chip:hover {
      background: linear-gradient(var(--hover-bg), var(--hover-bg)), var(--bg);
    }
  }

  .chip:active {
    background: linear-gradient(var(--pressed-bg), var(--pressed-bg)), var(--bg);
  }

  .shortcut-row .question { font-size: 13px; }

  .empty-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px;
  }

  .chip {
    padding: 6px 13px;
    margin: 0;
    border: none;
    border-radius: 9999px;
    background: var(--bg, transparent);
    font-size: 12px;
    cursor: pointer;
  }
</style>
