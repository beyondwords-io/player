<script>
  import { tick } from "svelte";
  import blurElement from "../../helpers/blurElement";
  import Orb from "./Orb.svelte";
  import ArrowUp from "../svg_icons/default_player/ArrowUp.svelte";
  import ArrowUpRight from "../svg_icons/default_player/ArrowUpRight.svelte";

  export let tokens;
  export let agentClient;
  export let agentPlaceholder = undefined;
  export let shortcuts = [];
  export let showSlashButton = true;
  export let onMessageSent = () => {};

  let thread = [];
  let input = "";
  let inputElement;
  let threadElement;
  let streaming = false;
  let streamHandle = null;
  let shortcutsOpen = false;
  let announced = "";

  $: placeholder = agentPlaceholder || "Ask about this article, or anything we've covered…";

  $: shortcutRows = shortcuts.map((question) => ({
    command: `/${String(question).replace(/[^a-zA-Z ]/g, "").trim().split(" ")[0].toLowerCase() || "ask"}`,
    question,
  }));

  const scrollToEnd = async () => {
    await tick();
    if (threadElement) { threadElement.scrollTop = threadElement.scrollHeight; }
  };

  const send = (question) => {
    const text = (question || input).trim();
    if (!text || streaming) { return; }

    input = "";
    shortcutsOpen = false;
    thread = [...thread, { role: "reader", text }, { role: "agent", text: "", citations: [], streaming: true }];
    streaming = true;
    onMessageSent(text);
    scrollToEnd();

    streamHandle = agentClient.send(text, {
      onClause: (clause) => {
        const last = thread[thread.length - 1];
        last.text += clause;
        thread = thread;
        scrollToEnd();
      },
      onDone: (citations) => {
        const last = thread[thread.length - 1];
        last.streaming = false;
        last.citations = citations || [];
        thread = thread;
        streaming = false;
        streamHandle = null;
        announced = last.text;
        scrollToEnd();
      },
    });
  };

  const stop = () => streamHandle?.stop();

  const handleKeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      send();
    } else if (event.key === "/" && input === "") {
      event.preventDefault();
      shortcutsOpen = shortcutRows.length > 0;
    } else if (event.key === "Escape" && shortcutsOpen) {
      event.stopPropagation();
      shortcutsOpen = false;
    }
  };
</script>

<div class="chat-panel">
  {#if thread.length > 0}
    <div class="thread" bind:this={threadElement}>
      {#each thread as message, i (i)}
        {#if message.role === "reader"}
          <div class="reader-row">
            <span class="bubble" style="background: {tokens.bubbleBackground}; color: {tokens.bubbleText}; border-radius: {tokens.radius.bubble}">{message.text}</span>
          </div>
        {:else}
          <div class="agent-row">
            <Orb size={20} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} generating={message.streaming} />
            <div class="answer-col">
              <span class="answer" style="color: {tokens.text}">
                {message.text}{#if message.streaming}<span class="cursor" style="background: {tokens.sendBackground}"></span>{/if}
              </span>
              {#if message.citations.length > 0}
                <span class="citations">
                  {#each message.citations as citation (citation.title)}
                    <a
                      class="citation"
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style="color: {tokens.citation}; background: {tokens.bubbleBackground}; border-color: {tokens.citationBorder}; outline-color: {tokens.text}"
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

  {#if shortcutsOpen && shortcutRows.length > 0}
    <div class="shortcuts" style="background: {tokens.bubbleBackground}; border-radius: {tokens.radius.bar}; box-shadow: {tokens.widgetShadow}">
      <span class="eyebrow" style="color: {tokens.muted}">Shortcuts</span>
      {#each shortcutRows as row (row.question)}
        <button type="button" class="shortcut-row" style="--hover-bg: {tokens.hover}; outline-color: {tokens.text}" on:click={() => send(row.question)}>
          <span class="command" style="color: {tokens.link}">{row.command}</span>
          <span class="question" style="color: {tokens.text}">{row.question}</span>
        </button>
      {/each}
    </div>
  {/if}

  <div class="composer" style="border-top-color: {tokens.divider}">
    {#if showSlashButton && shortcutRows.length > 0}
      <button
        type="button"
        class="slash"
        style="border-color: {tokens.divider}; background: {tokens.bubbleBackground}; color: {tokens.muted}; outline-color: {tokens.text}"
        aria-label="Shortcuts"
        aria-expanded={shortcutsOpen}
        on:click={() => shortcutsOpen = !shortcutsOpen}
        on:mouseup={blurElement}
      >/</button>
    {/if}

    <input
      bind:this={inputElement}
      bind:value={input}
      class="input"
      style="color: {tokens.text}; --placeholder-color: {tokens.placeholder}; outline-color: {tokens.text}"
      placeholder={placeholder}
      aria-label={placeholder}
      on:keydown={handleKeydown}
    />

    <slot name="composer-extras" />

    {#if streaming}
      <button type="button" class="send" style="background: {tokens.sendBackground}; outline-color: {tokens.text}" aria-label="Stop" on:click={stop} on:mouseup={blurElement}>
        <span class="stop-square" style="background: {tokens.sendIcon}"></span>
      </button>
    {:else}
      <button type="button" class="send" style="background: {tokens.sendBackground}; outline-color: {tokens.text}" aria-label="Send" on:click={() => send()} on:mouseup={blurElement}>
        <ArrowUp size={14} color={tokens.sendIcon} />
      </button>
    {/if}
  </div>
</div>

<style>
  .chat-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

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
  }

  .cursor {
    display: inline-block;
    width: 7px;
    height: 13px;
    margin-left: 2px;
    border-radius: 1px;
    vertical-align: text-bottom;
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  @media (prefers-reduced-motion: reduce) {
    .cursor {
      animation: none;
    }
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
    border-width: 1px;
    border-style: solid;
    border-radius: 9999px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
  }

  .citation:focus-visible {
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

  .shortcuts {
    display: flex;
    flex-direction: column;
    margin: 0 12px 12px;
    padding: 6px;
  }

  .eyebrow {
    padding: 6px 10px 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
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

  .shortcut-row:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: -2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .shortcut-row:hover {
      background: var(--hover-bg);
    }
  }

  .shortcut-row .command {
    width: 76px;
    flex-shrink: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
  }

  .shortcut-row .question {
    font-size: 13px;
  }

  .composer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-top-width: 1px;
    border-top-style: solid;
  }

  .slash {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    padding: 0;
    margin: 0;
    border-width: 1px;
    border-style: solid;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px;
    cursor: pointer;
  }

  .slash:focus-visible,
  .send:focus-visible,
  .input:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  .input {
    flex: 1;
    min-width: 0;
    padding: 4px 0;
    border: none;
    background: none;
    font-size: 13px;
  }

  .input::placeholder {
    color: var(--placeholder-color);
  }

  .send {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
  }

  .stop-square {
    display: block;
    width: 9px;
    height: 9px;
    border-radius: 1px;
  }
</style>
