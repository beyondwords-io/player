<script lang="ts">
  import type { AgentMessage } from "../../helpers/agentContracts";
  import type { DefaultPlayerTokens } from "../../helpers/defaultPlayerTokens";
  import ArrowUpRight from "../svg_icons/default_player/ArrowUpRight.svelte";
  import LockSimple from "../svg_icons/default_player/LockSimple.svelte";
  import Orb from "./Orb.svelte";

  export let announced = "";
  export let ctaText: string | undefined = undefined;
  export let ctaUrl: string | undefined = undefined;
  export let thread: AgentMessage[] = [];
  export let threadElement: HTMLDivElement | undefined = undefined;
  export let tokens: DefaultPlayerTokens;
</script>

{#if thread.length > 0}
  <div class="thread" bind:this={threadElement}>
    {#each thread as message, i (i)}
      {#if message.role === "reader"}
        <div class="reader-row">
          <span class="bubble" style="background: {tokens.bubbleBackground}; color: {tokens.bubbleText}; border-radius: {tokens.radius.bubble}">{message.text}</span>
        </div>
      {:else if message.role === "divider"}
        <div class="divider-row" role="separator">
          <span class="divider-line" style="background: {tokens.divider}"></span>
          <span class="divider-text" style="color: {tokens.muted}">{message.text}</span>
          <span class="divider-line" style="background: {tokens.divider}"></span>
        </div>
      {:else if message.role === "locked"}
        <div class="agent-row">
          <Orb size={20} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} dimmed={true} />
          <div class="answer-col">
            <span class="locked-answer">
              <LockSimple size={15} color={tokens.muted} />
              {#if ctaText && ctaUrl}
                <a class="subscribe" href={ctaUrl} target="_blank" rel="noopener noreferrer" style="color: {tokens.link}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}">{ctaText}</a>
              {:else if ctaText}
                <span style="color: {tokens.text}">{ctaText}</span>
              {/if}
            </span>
          </div>
        </div>
      {:else}
        <div class="agent-row">
          <Orb size={20} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} generating={message.streaming} />
          <div class="answer-col">
            <span class="answer" style="color: {tokens.text}">
              {#if message.typing}
                <!-- Decorative: the finished answer is what gets announced. -->
                <span class="typing" aria-hidden="true">
                  <span class="animating" style="background: {tokens.muted}"></span>
                  <span class="animating" style="background: {tokens.muted}"></span>
                  <span class="animating" style="background: {tokens.muted}"></span>
                </span>
              {:else}
                {message.text}{#if message.streaming}<span class="cursor animating" style="background: {tokens.sendBackground}"></span>{/if}
              {/if}
            </span>
            {#if message.citations.length > 0}
              <span class="citations">
                {#each message.citations as citation (citation.title)}
                  <a
                    class="citation"
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style="--bg: {tokens.bubbleBackground}; --hover-bg: {tokens.hover}; --border: {tokens.citationBorder}; --hover-border: {tokens.citation}; color: {tokens.citation}; outline-color: {tokens.text}"
                  >
                    {citation.title}
                    <ArrowUpRight size={11} color={tokens.citation} />
                  </a>
                {/each}
              </span>
            {/if}
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/if}

<span class="live-region" role="status" aria-live="polite">{announced}</span>

<style>
  .thread {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    max-height: 320px;
    overflow-y: auto;
  }

  .reader-row {
    display: flex;
    justify-content: flex-end;
  }

  .bubble {
    max-width: 75%;
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.45;
  }

  .agent-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .agent-row :global(.orb) {
    margin-top: 2px;
  }

  .answer-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .answer {
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-line;
  }

  .typing {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 20px;
  }

  .typing span {
    display: block;
    margin: 0;
    padding: 0;
    border: none;
    width: 5px;
    height: 5px;
    border-radius: 9999px;
    animation: typing 1.2s ease-in-out infinite;
  }

  .typing span:nth-child(2) { animation-delay: 0.15s; }
  .typing span:nth-child(3) { animation-delay: 0.3s; }

  @keyframes typing {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-2px); }
  }

  .cursor {
    display: inline-block;
    margin: 0 0 0 2px;
    padding: 0;
    border: none;
    width: 7px;
    height: 13px;
    border-radius: 1px;
    vertical-align: text-bottom;
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  @media (prefers-reduced-motion: reduce) {
    .cursor,
    .typing span { animation: none; }
    .typing span { opacity: 0.55; }
  }

  .citations {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .citation {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 9px;
    border: 1px solid var(--border);
    border-radius: 9999px;
    background: var(--bg, transparent);
    font-size: 10px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
  }

  @media (hover: hover) and (pointer: fine) {
    .citation:hover {
      background: var(--hover-bg);
      border-color: var(--hover-border);
    }
  }

  .citation:focus-visible,
  .subscribe:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  .live-region {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .divider-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .divider-line {
    flex: 1;
    height: 1px;
  }

  .divider-text {
    flex-shrink: 0;
    font-size: 11px;
  }

  .locked-answer {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .subscribe {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 500;
    text-decoration: none;
    border-bottom-width: 1px;
    border-bottom-style: dotted;
    cursor: pointer;
  }
</style>
