<script>
  import { tick, onDestroy } from "svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import Orb from "./Orb.svelte";
  import ArrowUp from "../svg_icons/default_player/ArrowUp.svelte";
  import ArrowUpRight from "../svg_icons/default_player/ArrowUpRight.svelte";
  import Microphone from "../svg_icons/default_player/Microphone.svelte";
  import Keyboard from "../svg_icons/default_player/Keyboard.svelte";
  import LockSimple from "../svg_icons/default_player/LockSimple.svelte";

  export let tokens;
  export let agentClient;
  export let agentPlaceholder = undefined;
  export let agentVoice = true;
  export let agentAccess = "full";
  export let agentLimit = undefined;
  export let shortcuts = [];
  export let isPlaying = false;
  export let onEvent = () => {};
  export let showSlashButton = true;
  export let emptyStateChips = false;
  export let onMessageSent = () => {};

  let thread = [];
  let input = "";
  let inputElement;
  let threadElement;
  let streaming = false;
  let streamHandle = null;
  let shortcutsOpen = false;
  let announced = "";
  let voiceMode = null; // null | "listening" | "talking"
  let listenHandle = null;
  let partialTranscript = "";
  let minuteTimer = null;
  let secondsLeft = null;
  let pausedForVoice = false;

  $: placeholder = agentPlaceholder || "Ask about this article, or anything we've covered…";

  // Limited access: a question budget ("3") or a voice-minutes budget ("5:00").
  $: minutesBudget = typeof agentLimit === "string" && agentLimit.includes(":");
  $: questionBudget = agentAccess === "limited" && !minutesBudget && parseInt(agentLimit, 10) > 0
    ? parseInt(agentLimit, 10)
    : null;
  $: questionsUsed = thread.filter((message) => message.role === "reader").length;
  $: questionsLeft = questionBudget === null ? null : Math.max(0, questionBudget - questionsUsed);
  $: if (agentAccess === "limited" && minutesBudget && secondsLeft === null) {
    const [mins, secs] = agentLimit.split(":").map((n) => parseInt(n, 10) || 0);
    secondsLeft = mins * 60 + secs;
  }
  $: budgetSpent = agentAccess === "limited" && (questionsLeft === 0 || (minutesBudget && secondsLeft === 0));
  $: showCounter = questionBudget !== null && questionsUsed >= 1 && !budgetSpent;

  $: formattedSecondsLeft = `${Math.floor((secondsLeft || 0) / 60)}:${`${(secondsLeft || 0) % 60}`.padStart(2, "0")}`;

  $: shortcutRows = shortcuts.map((question) => ({
    command: `/${String(question).replace(/[^a-zA-Z ]/g, "").trim().split(" ")[0].toLowerCase() || "ask"}`,
    question,
  }));

  const scrollToEnd = async () => {
    await tick();
    if (threadElement) { threadElement.scrollTop = threadElement.scrollHeight; }
  };

  const send = (question, { fromVoice = false } = {}) => {
    const text = (question || input).trim();
    if (!text || streaming || budgetSpent) { return; }

    input = "";
    shortcutsOpen = false;
    thread = [...thread, { role: "reader", text }, { role: "agent", text: "", citations: [], streaming: true }];
    streaming = true;
    voiceMode = fromVoice ? "talking" : null;
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
        if (voiceMode === "talking") { leaveVoiceMode(); }
        announced = last.text;
        scrollToEnd();
      },
    });
  };

  const stop = () => streamHandle?.stop();

  // Article audio resumes once the exchange is over, as it does after ducking.
  const leaveVoiceMode = () => {
    voiceMode = null;
    if (!pausedForVoice) { return; }

    pausedForVoice = false;

    onEvent(newEvent({
      type: "PressedPlay",
      description: "The play button was pressed.",
      initiatedBy: "user",
    }));
  };

  const startListening = () => {
    if (budgetSpent) { return; }

    // The mic would otherwise pick up the article audio.
    if (isPlaying) {
      pausedForVoice = true;

      onEvent(newEvent({
        type: "PressedPause",
        description: "The pause button was pressed.",
        initiatedBy: "user",
      }));
    }

    voiceMode = "listening";
    partialTranscript = "";
    listenHandle = agentClient.listen({ onPartial: (text) => partialTranscript = text });

    // Voice budgets count down only while the mic is live.
    if (minutesBudget && secondsLeft > 0) {
      minuteTimer = setInterval(() => {
        secondsLeft = Math.max(0, secondsLeft - 1);
        if (secondsLeft === 0) { stopListening({ send: false }); }
      }, 1000);
    }
  };

  const stopListening = ({ send: shouldSend = true } = {}) => {
    clearInterval(minuteTimer);
    minuteTimer = null;

    const transcript = listenHandle?.transcript() || partialTranscript;
    listenHandle?.stop();
    listenHandle = null;

    // Sending keeps us in voice mode for the spoken reply.
    if (shouldSend && transcript) {
      voiceMode = null;
      send(transcript, { fromVoice: true });
    } else {
      leaveVoiceMode();
    }
  };

  const switchToTyping = () => {
    clearInterval(minuteTimer);
    minuteTimer = null;

    const transcript = listenHandle?.transcript() || partialTranscript;
    listenHandle?.stop();
    listenHandle = null;
    leaveVoiceMode();
    input = transcript;
    tick().then(() => inputElement?.focus());
  };

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

  onDestroy(() => {
    clearInterval(minuteTimer);
    listenHandle?.stop();
    streamHandle?.stop();
  });
</script>

<div class="chat-panel">
  {#if emptyStateChips && thread.length === 0 && shortcuts.length > 0}
    <div class="empty-chips">
      {#each shortcuts as question (question)}
        <button
          type="button"
          class="chip"
          style="--bg: {tokens.bubbleBackground}; --hover-bg: {tokens.pressed}; color: {tokens.text}; outline-color: {tokens.text}"
          on:click={() => send(question)}
          on:mouseup={blurElement}
        >{question}</button>
      {/each}
    </div>
  {/if}

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

  {#if budgetSpent}
    <div class="composer spent" style="border-top-color: {tokens.divider}">
      <LockSimple size={15} color={tokens.muted} />
      <span class="spent-copy" style="color: {tokens.muted}">
        {#if minutesBudget}
          You've used your free conversation time.
        {:else}
          You've used your {questionBudget} free questions.
        {/if}
      </span>
      <a class="subscribe" href="#subscribe" style="color: {tokens.link}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}">Subscribe to keep talking</a>
    </div>
  {:else if voiceMode === "listening"}
    <div class="composer listening" style="border-top-color: {tokens.divider}">
      <Orb size={24} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} />
      <span class="listening-label" style="color: {tokens.text}">Listening…</span>
      <span class="partial" style="color: {tokens.muted}">{partialTranscript}</span>
      {#if minutesBudget}
        <span class="counter" style="color: {tokens.muted}">{formattedSecondsLeft} left</span>
      {/if}
      <button type="button" class="quiet" style="outline-color: {tokens.text}; --hover-bg: {tokens.hover}" aria-label="Switch to typing" on:click={switchToTyping} on:mouseup={blurElement}>
        <Keyboard size={18} color={tokens.muted} />
      </button>
      <button type="button" class="send" style="background: {tokens.sendBackground}; outline-color: {tokens.text}" aria-label="Stop listening" on:click={() => stopListening()} on:mouseup={blurElement}>
        <span class="stop-square" style="background: {tokens.sendIcon}"></span>
      </button>
    </div>
  {:else if voiceMode === "talking"}
    <div class="composer talking" style="border-top-color: {tokens.divider}">
      <span class="talking-label" style="color: {tokens.muted}">Talking</span>
      <button type="button" class="send" style="background: {tokens.sendBackground}; outline-color: {tokens.text}" aria-label="Stop" on:click={stop} on:mouseup={blurElement}>
        <span class="stop-square" style="background: {tokens.sendIcon}"></span>
      </button>
    </div>
  {:else}
    <div class="composer" style="border-top-color: {tokens.divider}">
      {#if showSlashButton && shortcutRows.length > 0}
        <button
          type="button"
          class="slash"
          style="border-color: {tokens.divider}; --bg: {shortcutsOpen ? tokens.pressed : tokens.bubbleBackground}; --hover-bg: {tokens.pressed}; color: {tokens.muted}; outline-color: {tokens.text}"
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

      {#if showCounter}
        <span class="counter" style="color: {tokens.muted}">{questionsLeft} of {questionBudget} left</span>
      {/if}

      {#if agentVoice}
        <button type="button" class="quiet" style="outline-color: {tokens.text}; --hover-bg: {tokens.hover}" aria-label="Speak" on:click={startListening} on:mouseup={blurElement}>
          <Microphone size={18} color={tokens.muted} />
        </button>
      {/if}

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
  {/if}
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
    border-color: var(--border);
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
    font-size: 13px;
    cursor: pointer;
  }

  @media (hover: hover) and (pointer: fine) {
    .slash:hover,
    .quiet:hover {
      background: var(--hover-bg, transparent);
    }
  }

  .slash:focus-visible,
  .send:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  /* Text inputs match :focus-visible even on pointer clicks, so the caret is
     the focus affordance here - no ring. */
  .input:focus-visible {
    outline: none;
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
    transition: opacity 150ms ease-out;
    flex-shrink: 0;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
  }

  @media (hover: hover) and (pointer: fine) {
    .send:hover {
      opacity: 0.85;
    }
  }

  .stop-square {
    display: block;
    width: 9px;
    height: 9px;
    border-radius: 1px;
  }

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

  .chip:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .chip:hover {
      background: var(--hover-bg);
    }
  }

  .quiet {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 4px;
    margin: 0;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .quiet:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  .counter {
    flex-shrink: 0;
    font-size: 10px;
    white-space: nowrap;
  }

  .listening-label {
    flex-shrink: 0;
    font-size: 13px;
  }

  .partial {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .talking-label {
    flex: 1;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .composer.spent {
    align-items: center;
  }

  .spent-copy {
    flex: 1;
    min-width: 0;
    font-size: 12px;
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

  .subscribe:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }
</style>
