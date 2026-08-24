<script lang="ts">
  import formatTime from "../../helpers/formatTime";
  import deriveAgentAccessPolicy from "../../helpers/agentAccessPolicy";
  import type { AgentLimit } from "../../helpers/agentAccessPolicy";
  import type { AgentClient } from "../../helpers/agentContracts";
  import type { DefaultPlayerTokens } from "../../helpers/defaultPlayerTokens";
  import { tick } from "svelte";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";
  import Orb from "./Orb.svelte";
  import ChatShortcuts from "./ChatShortcuts.svelte";
  import ChatThread from "./ChatThread.svelte";
  import ArrowUp from "../svg_icons/default_player/ArrowUp.svelte";
  import VoiceMode from "../svg_icons/default_player/VoiceMode.svelte";
  import LockSimple from "../svg_icons/default_player/LockSimple.svelte";

  export let tokens: DefaultPlayerTokens;
  export let agentClient: AgentClient;
  export let agentPlaceholder: string | undefined = undefined;
  export let agentVoice = true;
  export let agentQuestionsLimit: AgentLimit = null;
  export let agentVoiceSecondsLimit: AgentLimit = null;
  export let agentQuestionsRemaining: AgentLimit = null;
  export let agentVoiceSecondsRemaining: AgentLimit = null;
  export let onAgentQuestion: () => void = () => {};
  // The publisher's own words for the upgrade, or nothing at all.
  export let ctaText: string | undefined = undefined;
  export let ctaUrl: string | undefined = undefined;
  export let shortcuts: string[] = [];
  export let showSlashButton = true;

  let input = "";
  let threadElement: HTMLDivElement | undefined;
  let shortcutsOpen = false;

  // The client is the store: thread rows, the conversation kind, and the voice
  // call's state all live there, because they outlive this component.
  $: thread = $agentClient.thread;
  $: kind = $agentClient.kind;
  $: status = $agentClient.status;
  $: announced = $agentClient.announced;
  $: lastRow = thread[thread.length - 1];
  $: streaming = !!(lastRow?.role === "agent" && lastRow.streaming);
  $: inCall = kind === "voice" && status !== "connecting";

  $: placeholder = agentPlaceholder || `${translate("askAboutThisArticle")}…`;

  // The two allowances are independent. null is unlimited, zero disables that
  // mode, and only both modes being unavailable locks the whole agent.
  $: questionBudget = agentQuestionsLimit;
  $: voiceBudget = agentVoiceSecondsLimit;
  $: questionsLeft = agentQuestionsRemaining;
  $: secondsLeft = agentVoiceSecondsRemaining;
  $: accessPolicy = deriveAgentAccessPolicy({
    questionsLimit: questionBudget,
    questionsRemaining: questionsLeft,
    voiceSecondsLimit: voiceBudget,
    voiceSecondsRemaining: secondsLeft,
    voiceEnabled: agentVoice,
    thread,
  });
  $: budgetSpent = accessPolicy.budgetSpent;
  $: locked = accessPolicy.locked;
  $: lockedAsked = accessPolicy.lockedAsked;
  $: showCounter = accessPolicy.showQuestionCounter;
  $: spentReason = accessPolicy.spentReason;
  $: textAvailable = accessPolicy.textAvailable;
  $: voiceAvailable = accessPolicy.voiceAvailable;

  $: formattedSecondsLeft = formatTime(secondsLeft || 0);

  // Pressing / lists the publisher's questions and typing narrows them. There
  // are no commands to invent, and nothing to collide.
  $: shortcutQuery = input.startsWith("/") ? input.slice(1).trim().toLowerCase() : "";
  $: shortcutRows = shortcuts.filter((question) => (
    !shortcutQuery || String(question).toLowerCase().includes(shortcutQuery)
  ));

  // Keep the list up while the reader is still typing a search, and drop it as
  // soon as it can no longer match anything.
  $: if (shortcutsOpen && input !== "" && !input.startsWith("/")) { shortcutsOpen = false; }
  $: if (shortcutsOpen && shortcutRows.length === 0) { shortcutsOpen = false; }

  const scrollToEnd = async () => {
    await tick();
    if (threadElement) { threadElement.scrollTop = threadElement.scrollHeight; }
  };

  const send = (question = ""): void => {
    const text = (question || input).trim();
    if (!text || budgetSpent || (!locked && !textAvailable)) { return; }

    // A text reply finishes before the next ask; in a call, sending over the
    // agent interrupts it, exactly like speaking over it.
    if (streaming && kind !== "voice") { return; }

    input = "";
    shortcutsOpen = false;

    // Locked: the question is worth asking for, so keep it on screen and answer
    // with the publisher's offer rather than pretending to think.
    if (locked) {
      agentClient.appendLocked(text);
      scrollToEnd();
      return;
    }

    agentClient.sendUserMessage(text);
    onAgentQuestion();
    scrollToEnd();
  };

  const stop = () => agentClient.interrupt();

  // The waveform starts a call; the composer becomes the strip in place.
  const startCall = () => {
    if (budgetSpent || locked || !voiceAvailable) { return; }

    agentClient.startSession();
  };

  const endCall = () => agentClient.endSession();

  const handleKeydown = (event: KeyboardEvent): void => {
    agentClient.sendUserActivity();

    if (event.key === "Enter") {
      event.preventDefault();

      // With the list up, Enter takes the question the reader narrowed down to.
      if (shortcutsOpen && shortcutRows.length > 0) { send(shortcutRows[0]); } else { send(); }
    } else if (event.key === "/" && input === "") {
      // Put the slash in the field ourselves: the binding updates after this
      // handler, and the guard below would read the field as still empty.
      event.preventDefault();
      input = "/";
      shortcutsOpen = shortcuts.length > 0;
    } else if (event.key === "Escape" && shortcutsOpen) {
      event.stopPropagation();
      shortcutsOpen = false;
    }
  };

</script>

<div class="chat-panel">
  <ChatShortcuts empty={true} open={thread.length === 0 && shortcuts.length > 0 && (locked || textAvailable)} questions={shortcuts} {tokens} onSelect={send} />
  <ChatThread {thread} {announced} {ctaText} {ctaUrl} {tokens} bind:threadElement />
  <ChatShortcuts open={shortcutsOpen} questions={shortcutRows} {tokens} onSelect={send} />

  {#if budgetSpent || lockedAsked}
    <div class="composer spent" style="border-top-color: {tokens.divider}">
      <LockSimple size={15} color={tokens.muted} />
      <span class="spent-copy" style="color: {tokens.muted}">
        {#if lockedAsked}
          <!-- The CTA above the composer already says it; no need to repeat. -->
        {:else if spentReason === "voice"}
          {translate("freeConversationTimeUsed")}
        {:else}
          {translate(questionBudget === 1 ? "freeQuestionUsed" : "freeQuestionsUsed").replace("{n}", String(questionBudget))}
        {/if}
      </span>
      {#if ctaText && ctaUrl}
        <a class="subscribe" href={ctaUrl} target="_blank" rel="noopener noreferrer" style="color: {tokens.link}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}">{ctaText}</a>
      {:else if ctaText}
        <span class="subscribe" style="color: {tokens.muted}">{ctaText}</span>
      {/if}
    </div>
  {:else if status === "connecting"}
    <div class="composer strip" style="border-top-color: {tokens.divider}">
      <Orb size={24} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} generating={true} />
      <span class="strip-label" style="color: {tokens.text}">{translate("connecting")}</span>
      <span class="strip-grow"></span>
      <button type="button" class="pill" style="border-color: {tokens.divider}; color: {tokens.text}; --hover-bg: {tokens.hover}; outline-color: {tokens.text}" on:click={() => agentClient.cancelConnect()} on:mouseup={blurElement}>{translate("cancel")}</button>
    </div>
  {:else}
    {#if inCall}
      <div class="composer strip" style="border-top-color: {tokens.divider}">
        <Orb size={24} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} generating={status === "talking"} />
        {#if status === "talking" && agentClient.canInterrupt}
          <!-- The whole label is the interrupt: speak over it, or tap. -->
          <button type="button" class="strip-interrupt" style="color: {tokens.text}; outline-color: {tokens.text}" on:click={stop} on:mouseup={blurElement}>
            {translate("talkingSpeakOverOrTap")}
          </button>
        {:else if status === "talking"}
          <!-- The live agent has no client-side interrupt; speaking over it is the interrupt. -->
          <span class="strip-label" style="color: {tokens.text}">{translate("talkingSpeakOver")}</span>
        {:else}
          <span class="strip-label" style="color: {tokens.text}">{translate("listening")}</span>
        {/if}
        <span class="strip-grow"></span>
        {#if voiceBudget !== null}
          <span class="counter" style="color: {tokens.muted}">{translate("timeLeft").replace("{time}", formattedSecondsLeft)}</span>
        {/if}
        <button type="button" class="pill" style="border-color: {tokens.divider}; color: {tokens.text}; --hover-bg: {tokens.hover}; outline-color: {tokens.text}" on:click={endCall} on:mouseup={blurElement}>{translate("end")}</button>
      </div>
    {/if}
    <div class="composer" class:borderless={inCall} style="border-top-color: {tokens.divider}">
      {#if showSlashButton && shortcuts.length > 0 && (locked || textAvailable)}
        <button
          type="button"
          class="slash"
          style="border-color: {tokens.divider}; --bg: {shortcutsOpen ? tokens.pressed : tokens.bubbleBackground}; --hover-bg: {tokens.pressed}; color: {tokens.muted}; outline-color: {tokens.text}"
          aria-label={translate("shortcuts")}
          aria-expanded={shortcutsOpen}
          on:click={() => shortcutsOpen = !shortcutsOpen}
          on:mouseup={blurElement}
        >/</button>
      {/if}

      <input
        bind:value={input}
        class="input"
        style="color: {tokens.text}; --placeholder-color: {tokens.placeholder}; outline-color: {tokens.text}"
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={!locked && !textAvailable}
        on:keydown={handleKeydown}
      />

      {#if showCounter}
        <span class="counter" style="color: {tokens.muted}">{translate("questionsRemaining").replace("{remaining}", String(questionsLeft)).replace("{total}", String(questionBudget))}</span>
      {/if}

      {#if voiceAvailable && !locked && kind === "none"}
        <button type="button" class="voice" style="background: {tokens.hover}; --hover-bg: {tokens.pressed}; outline-color: {tokens.text}" aria-label={translate("startVoiceConversation")} on:click={startCall} on:mouseup={blurElement}>
          <VoiceMode size={20} color={tokens.text} />
        </button>
      {/if}

      {#if streaming}
        <button type="button" class="send" style="background: {tokens.sendBackground}; outline-color: {tokens.text}" aria-label={translate("stop")} on:click={stop} on:mouseup={blurElement}>
          <span class="stop-square" style="background: {tokens.sendIcon}"></span>
        </button>
      {:else}
        <button type="button" class="send" disabled={!locked && !textAvailable} style="background: {tokens.sendBackground}; outline-color: {tokens.text}" aria-label={translate("send")} on:click={() => send()} on:mouseup={blurElement}>
          <ArrowUp size={16} color={tokens.sendIcon} />
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
    .slash:hover {
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

  .input:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .send {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    transition: opacity 150ms ease-out;
    flex-shrink: 0;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
  }

  .send:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (hover: hover) and (pointer: fine) {
    .send:not(:disabled):hover {
      opacity: 0.85;
    }
  }

  .stop-square {
    display: block;
    width: 9px;
    height: 9px;
    border-radius: 1px;
  }

  .counter {
    flex-shrink: 0;
    font-size: 10px;
    white-space: nowrap;
  }

  .strip-label {
    flex-shrink: 0;
    font-size: 13px;
  }

  .strip-grow {
    flex: 1;
  }

  .strip-interrupt {
    flex-shrink: 0;
    padding: 4px 2px;
    margin: 0;
    border: none;
    background: none;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
  }

  .strip-interrupt:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  .pill {
    flex-shrink: 0;
    padding: 6px 14px;
    margin: 0;
    border-width: 1px;
    border-style: solid;
    border-radius: 9999px;
    background: transparent;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
  }

  .pill:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .pill:hover {
      background: var(--hover-bg);
    }
  }

  /* The waveform is the same 40px disc as the play button - thumb-sized, and
     visibly "you can talk" through its tint. */
  .voice {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
  }

  .voice:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .voice:hover {
      background: var(--hover-bg);
    }
  }

  .composer.borderless {
    border-top: none;
    padding-top: 8px;
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
