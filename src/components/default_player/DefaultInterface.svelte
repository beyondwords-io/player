<!-- svelte-ignore unused-export-let -->
<script>
  import { onMount } from "svelte";
  import { slide, fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";
  import deriveTokens from "../../helpers/default_theme/deriveTokens";
  import explicitOverrides from "../../helpers/default_theme/explicitOverrides";
  import { clampContrast, luminance, parseColor } from "../../helpers/default_theme/colorMath";
  import MockAgentClient from "../../helpers/agentClient";
  import chooseAdvertText from "../../helpers/chooseAdvertText";
  import ensureProtocol from "../../helpers/ensureProtocol";
  import WifiSlash from "../svg_icons/default_player/WifiSlash.svelte";
  import PlayCircle from "../svg_icons/default_player/PlayCircle.svelte";
  import PauseCircle from "../svg_icons/default_player/PauseCircle.svelte";
  import Queue from "../svg_icons/default_player/Queue.svelte";
  import DotsThree from "../svg_icons/default_player/DotsThree.svelte";
  import CaretDown from "../svg_icons/default_player/CaretDown.svelte";
  import ProgressTrack from "./ProgressTrack.svelte";
  import SkipButton from "./SkipButton.svelte";
  import SpeedButton from "./SpeedButton.svelte";
  import Menu from "./Menu.svelte";
  import QueuePanel from "./QueuePanel.svelte";
  import ChatPanel from "./ChatPanel.svelte";
  import Orb from "./Orb.svelte";
  import VideoFrame from "./VideoFrame.svelte";
  import Visibility from "../helpers/Visibility.svelte";
  import LockSimple from "../svg_icons/default_player/LockSimple.svelte";
  import Info from "../svg_icons/default_player/Info.svelte";
  import Close from "../svg_icons/default_player/Close.svelte";

  export let onEvent = () => {};
  export let embedMode = "audio";
  export let theme = "light";
  export let radius = 8;
  export let content = [];
  export let contentIndex = 0;
  export let summary = false;
  export let duration = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let playbackRate = 1;
  export let playbackRates = [];
  export let skipButtonStyle = "auto";
  export let downloadFormats = [];
  export let playerTitle = undefined;
  export let callToAction = undefined;
  export let contentLanguage = "en";
  export let languages = [];
  export let textColor = undefined;
  export let backgroundColor = undefined;
  export let iconColor = undefined;
  export let highlightColor = undefined;
  export let wordHighlightColor = undefined;
  export let videoTextColor = undefined;
  export let videoIconColor = undefined;
  export let agentColor = undefined;
  export let agentAvatar = undefined;
  export let accentColor = undefined;
  export let accentTextColor = undefined;
  export let agentAccess = "full";
  export let agentLimit = undefined;
  export let agentVoice = true;
  export let agentPlaceholder = undefined;
  export let agentName = undefined;
  export let shortcuts = [];
  export let infoText = undefined;
  export let disclosureText = undefined;
  export let disclosureLink = undefined;
  export let logoIconEnabled = true;
  export let activeAdvert = undefined;
  export let activeIntroOrOutro = undefined;
  export let persistentAdvert = undefined;
  export let metadataLoaded = false;
  export let fixedPosition = undefined;
  export let fixedWidth = "auto";
  export let fixedMargin = "16px";
  export let showClose = false;
  export let isWidget = false;
  export let analyticsId = undefined;
  export let isVisible = undefined;
  export let relativeY = undefined;
  export let absoluteY = undefined;
  export let videoIsBehind = false;
  export let aspectRatio = 16 / 9;

  let element;
  let width = 600;
  let queueOpen = false;
  let chatOpen = false;
  let infoOpen = false;
  let openMenu = null;
  let menuLeft = 8;
  let selectedLanguage;
  let docked = false;
  let offline = false;
  let hasFinished = false;
  let pageBackground = "#ffffff";

  const agentClient = new MockAgentClient();

  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  $: unfoldMs = reduceMotion || (typeof window !== "undefined" && window.disableAnimation) ? 0 : 240;
  $: collapseMs = reduceMotion || (typeof window !== "undefined" && window.disableAnimation) ? 0 : 180;

  $: isAdvert = !!activeAdvert && playbackState !== "stopped";

  // Ad creatives can override the slot's colours for their duration, as today.
  $: adOverrides = isAdvert ? explicitOverrides({
    textColor: activeAdvert.textColor,
    backgroundColor: activeAdvert.backgroundColor,
    iconColor: activeAdvert.iconColor,
  }) : {};

  $: overrides = {
    ...explicitOverrides({
      textColor, backgroundColor, iconColor, highlightColor, wordHighlightColor,
      videoTextColor, videoIconColor, agentColor, agentAvatar, accentColor, accentTextColor,
    }),
    ...adOverrides,
  };

  $: tokens = deriveTokens({ theme, radius, overrides, pageDark });
  $: displayBackground = overrides.backgroundColor || tokens.background;

  $: contentItem = content[contentIndex] || {};
  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";
  $: isPlaylist = content.length > 1;
  $: progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  $: skipStyle = skipButtonStyle === "auto" ? (isPlaylist ? "tracks" : "segments") : skipButtonStyle;

  // Width folds: speed and the time pair compress first, then the skips.
  // The container width drives this, not the viewport.
  $: compact = width < 375;
  $: foldSpeed = compact;
  $: remainingOnly = compact;
  $: foldSkips = width < 360;

  $: advertHref = ensureProtocol(activeAdvert?.clickThroughUrl || "") || undefined;
  $: advertText = advertHref ? chooseAdvertText(advertHref) : "";
  $: persistentHref = ensureProtocol(persistentAdvert?.clickThroughUrl || "") || undefined;
  $: persistentText = persistentHref ? chooseAdvertText(persistentHref) : "";
  $: showPersistentChip = !isAdvert && !isStopped && !!persistentHref && !!persistentText;
  $: buffering = isPlaying && !metadataLoaded;

  $: if (isPlaying && duration > 0 && currentTime / duration > 0.98) { hasFinished = true; }
  $: if (isPlaying && duration > 0 && currentTime / duration < 0.5) { hasFinished = false; }

  $: stoppedTitle = hasFinished ? "Listen again" : callToAction || translate("listenToThisArticle");
  $: playingTitle = contentItem.title || playerTitle || stoppedTitle;

  $: totalMins = translate("minutesSingularOrPlural").replace("{n}", Math.max(1, Math.round(duration / 60)));
  $: hasVersions = !!contentItem.summarization;
  $: hasLanguages = languages.length > 1;
  $: languageName = languageNameFor(selectedLanguage || contentLanguage);
  $: versionLabel = summary ? "Summary" : totalMins;

  $: hasInfo = !!infoText;
  $: foldInfo = width < 400;
  $: showOverflow = (!isStopped && (hasVersions || hasLanguages || foldSpeed)) || (hasInfo && foldInfo);

  $: isFixed = isWidget && !!fixedPosition;
  $: fixedSide = fixedPosition === "auto" || fixedPosition === true ? "center" : fixedPosition;
  $: widthStyle = !isFixed ? "" :
    docked ? "100%" :
    fixedWidth === "auto" || fixedWidth === 0 || fixedWidth === "0" ? `min(440px, calc(100vw - 2 * ${fixedMargin || "16px"}))` :
    fixedWidth;

  $: surfaceRadius = docked && isFixed ? "12px 12px 0 0" : tokens.radius.bar;
  $: surfaceShadow = docked && isFixed ? "0 -2px 8px rgba(0, 0, 0, 0.12)" :
    isFixed ? tokens.widgetShadow : tokens.barRing;

  $: showCaption = !!disclosureText || logoIconEnabled;
  $: pageDark = luminance(pageBackground) < 0.35;
  // The caption row sits on the page, not the surface, so its colours clamp
  // against the page background.
  $: captionColor = clampContrast(tokens.muted, pageBackground, 4.5);
  $: attributionHref = typeof window === "undefined" ? "https://beyondwords.io" :
    `https://beyondwords.io/?utm_source=${encodeURIComponent(window.location.origin)}&utm_medium=player&utm_campaign=${analyticsId || ""}`;

  $: showChat = embedMode !== "audio" && agentAccess !== "off" && !isAdvert;
  $: isAdvert && (chatOpen = false);
  $: chatDisabled = agentAccess === "disabled";
  $: chatLabelVisible = width >= 340;
  $: agentOnly = embedMode === "agent";
  $: agentPrompt = agentName ? `Ask ${agentName}` : "Ask about this article, or anything we've covered";

  $: playPauseLabel = isPlaying ? translate("pauseAudio") : translate("playAudio");

  $: versionItems = [
    { value: "full", label: "Full", secondary: formatMins(contentItem.duration), selected: !summary },
    { value: "summary", label: "Summary", secondary: formatMins(contentItem.summarization?.duration), selected: summary },
  ];

  $: languageItems = languages.map((code) => ({
    value: code,
    label: languageNameFor(code),
    selected: code === (selectedLanguage || String(contentLanguage).split(/[-_]/)[0]),
  }));

  $: speedItems = [{ value: "speed", label: "Speed", secondary: `${playbackRate}×`, selected: false, keepOpen: true }];

  $: menuGroups =
    openMenu === "version" ? [{ label: "Version", items: versionItems }] :
    openMenu === "language" ? [{ label: "Language", items: languageItems }] :
    openMenu === "overflow" ? [
      ...(hasVersions && !isStopped ? [{ label: "Version", items: versionItems }] : []),
      ...(hasLanguages && !isStopped ? [{ label: "Language", items: languageItems }] : []),
      ...(foldSpeed && !isStopped ? [{ label: "Speed", items: speedItems }] : []),
      ...(hasInfo && foldInfo ? [{ label: "About", items: [{ value: "info", label: "About this audio", selected: infoOpen }] }] : []),
    ] : [];

  const languageNameFor = (code) => {
    const base = String(code || "en").split(/[-_]/)[0].toLowerCase();
    try {
      return new Intl.DisplayNames([base], { type: "language" }).of(base) || base;
    } catch {
      return base;
    }
  };

  const formatMins = (seconds) => {
    if (!seconds) { return undefined; }
    return translate("minutesSingularOrPlural").replace("{n}", Math.max(1, Math.round(seconds / 60)));
  };

  const formatTime = (seconds) => {
    const whole = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(whole / 60);
    const secs = `${whole % 60}`.padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handlePlayPause = (event) => {
    event.preventDefault();
    const name = isPlaying ? "Pause" : "Play";

    onEvent(newEvent({
      type: `Pressed${name}`,
      description: `The ${name.toLowerCase()} button was pressed.`,
      initiatedBy: "user",
    }));
  };

  const openMenuAt = (name) => (event) => {
    if (openMenu === name) { openMenu = null; return; }

    const anchor = event.currentTarget.getBoundingClientRect();
    const root = element.getBoundingClientRect();

    menuLeft = Math.max(8, Math.min(anchor.left - root.left, root.width - 228));
    openMenu = name;
  };

  const handleMenuSelect = (item) => {
    if (item.value === "full" || item.value === "summary") {
      summary = item.value === "summary";
    } else if (item.value === "speed") {
      onEvent(newEvent({
        type: "PressedChangeRate",
        description: "The change playback rate button was pressed.",
        initiatedBy: "user",
      }));
    } else if (item.value === "info") {
      toggleInfo();
    } else {
      selectedLanguage = item.value;
    }
  };

  const toggleInfo = () => {
    infoOpen = !infoOpen;
    if (infoOpen) { chatOpen = false; queueOpen = false; }
  };

  const handleCloseWidget = () => {
    onEvent(newEvent({
      type: "PressedCloseWidget",
      description: "The close widget button was pressed.",
      initiatedBy: "user",
    }));
  };

  const toggleQueue = () => {
    queueOpen = !queueOpen;
    if (queueOpen) { chatOpen = false; }
  };

  const toggleChat = () => {
    chatOpen = !chatOpen;
    if (chatOpen) { queueOpen = false; openMenu = null; }

    // Chat over video pauses playback so the panel never fights the frame.
    if (chatOpen && videoIsBehind && isPlaying) {
      onEvent(newEvent({
        type: "PressedPause",
        description: "The pause button was pressed.",
        initiatedBy: "user",
      }));
    }
  };

  const handleRootKeydown = (event) => {
    if (event.key !== "Escape") { return; }
    if (chatOpen || infoOpen || queueOpen) {
      chatOpen = false;
      infoOpen = false;
      queueOpen = false;
    }
  };

  onMount(() => {
    const observer = new ResizeObserver(() => width = element?.clientWidth || width);
    if (element) { observer.observe(element); }

    const mobileQuery = matchMedia("(max-width: 640px)");
    const updateDocked = () => docked = mobileQuery.matches;
    updateDocked();
    mobileQuery.addEventListener("change", updateDocked);

    const bodyStyle = getComputedStyle(document.body);
    const parsed = parseColor(bodyStyle.backgroundColor);
    if (parsed && parsed.a > 0) { pageBackground = bodyStyle.backgroundColor; }

    offline = typeof navigator !== "undefined" && navigator.onLine === false;
    const handleOffline = () => offline = true;
    const handleOnline = () => offline = false;
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener("change", updateDocked);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  });
</script>

<div
  bind:this={element}
  class="default-player"
  class:dark={tokens.isDark}
  class:fixed={isFixed}
  class:docked={docked && isFixed}
  class:fixed-left={isFixed && fixedSide === "left"}
  class:fixed-center={isFixed && fixedSide === "center"}
  class:fixed-right={isFixed && fixedSide === "right"}
  style="--fixed-margin: {fixedMargin || "16px"}; width: {widthStyle};"
  in:fly|global={{ y: isFixed ? 12 : 0, duration: isFixed ? (reduceMotion ? 0 : 200) : 0, easing: cubicOut }}
  out:fade|global={{ duration: isFixed && !reduceMotion ? 150 : 0 }}
  on:keydown={handleRootKeydown}
  role="none"
>
<div class="surface" style="background: {displayBackground}; border-radius: {surfaceRadius}; box-shadow: {surfaceShadow};">
  {#if videoIsBehind && !agentOnly}
    <VideoFrame
      {tokens}
      {aspectRatio}
      {playbackState}
      {duration}
      {currentTime}
      title={playingTitle}
      {showChat}
      {chatOpen}
      onToggleChat={toggleChat}
      {onEvent} />

    {#if chatOpen && showChat && !chatDisabled}
      <div class="chat-unfold" transition:slide|local={{ duration: chatOpen ? unfoldMs : collapseMs, easing: cubicOut }}>
        <ChatPanel
          {tokens}
          {agentClient}
          {agentPlaceholder}
          {agentVoice}
          {agentAccess}
          {agentLimit}
          {shortcuts} />
      </div>
    {/if}
  {:else if agentOnly}
    <div class="agent-header">
      <Orb size={24} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} />
      <span class="agent-prompt" style="color: {tokens.text}">{agentPrompt}</span>
    </div>
    <div class="hairline" style="background: {tokens.divider}"></div>
    <ChatPanel
      {tokens}
      {agentClient}
      {agentPlaceholder}
      {agentVoice}
      {agentAccess}
      {agentLimit}
      {shortcuts}
      showSlashButton={false}
      emptyStateChips={true} />
  {:else}
  <div class="bar" class:compact>
    <Visibility {onEvent} enabled={!isWidget} bind:isVisible bind:relativeY bind:absoluteY>
      <button
        type="button"
        class="play-pause"
        style="color: {tokens.icon}; outline-color: {tokens.text}"
        aria-label={playPauseLabel}
        on:click={handlePlayPause}
        on:mouseup={blurElement}
      >
        {#if isPlaying}
          <PauseCircle size={40} color={tokens.icon} />
        {:else}
          <PlayCircle size={40} color={tokens.icon} />
        {/if}
      </button>
    </Visibility>

    <div class="title-col" class:playing={!isStopped}>
      {#if isStopped}
        <span class="title" style="color: {tokens.text}">{stoppedTitle}</span>
        <span class="meta">
          {#if hasVersions}
            <button type="button" class="trigger" style="color: {tokens.muted}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}" on:click={openMenuAt("version")} aria-expanded={openMenu === "version"}>{versionLabel}</button>
          {:else}
            <span class="plain" style="color: {tokens.muted}">{versionLabel}</span>
          {/if}

          <span class="separator" style="color: {tokens.muted}">·</span>

          {#if hasLanguages}
            <button type="button" class="trigger" style="color: {tokens.muted}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}" on:click={openMenuAt("language")} aria-expanded={openMenu === "language"}>{languageName}</button>
          {:else}
            <span class="plain" style="color: {tokens.muted}">{languageName}</span>
          {/if}
        </span>
      {:else if isAdvert}
        <div class="title-row">
          {#if advertHref && advertText}
            <a class="advert-link" href={advertHref} target="_blank" rel="noopener noreferrer" style="color: {tokens.text}; outline-color: {tokens.text}">{advertText}</a>
          {:else}
            <span class="title playing" style="color: {tokens.text}">{playingTitle}</span>
          {/if}
          <span class="time" style="color: {tokens.text}">{formatTime(Math.max(0, duration - currentTime))} left</span>
          <span class="ad-badge" style="color: {tokens.muted}; border-color: {tokens.underline}">AD</span>
        </div>
        <ProgressTrack
          {progress}
          {duration}
          readonly={true}
          trackColor={tokens.track}
          fillColor={tokens.text}
          focusColor={tokens.text}
          {onEvent} />
      {:else if offline}
        <div class="title-row">
          <span class="title playing" style="color: {tokens.text}; opacity: 0.4">{playingTitle}</span>
          <span class="offline-note" style="color: {tokens.muted}">
            <WifiSlash size={12} color={tokens.muted} />
            Offline — will resume
          </span>
        </div>
        <ProgressTrack
          {progress}
          {duration}
          readonly={true}
          trackColor={tokens.track}
          fillColor={tokens.text}
          fillOpacity={0.4}
          focusColor={tokens.text}
          {onEvent} />
      {:else}
        <div class="title-row">
          <span class="title playing" style="color: {tokens.text}">{playingTitle}</span>
          {#if remainingOnly}
            <span class="time" style="color: {tokens.text}">-{formatTime(duration - currentTime)}</span>
          {:else}
            <span class="time" style="color: {tokens.text}">{formatTime(currentTime)} / {formatTime(duration)}</span>
          {/if}
        </div>
        <ProgressTrack
          {progress}
          {duration}
          {buffering}
          trackColor={tokens.track}
          fillColor={tokens.text}
          focusColor={tokens.text}
          {onEvent} />
      {/if}
    </div>

    {#if showPersistentChip}
      <a class="persistent-chip" href={persistentHref} target="_blank" rel="noopener noreferrer" style="--hover-bg: {tokens.hover}; color: {tokens.muted}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}">
        {persistentText}
        <span class="ad-badge" style="color: {tokens.muted}; border-color: {tokens.underline}">AD</span>
      </a>
    {/if}

    {#if !isStopped && !foldSkips && !isAdvert}
      <SkipButton direction="prev" style={skipStyle} color={tokens.icon} hoverBackground={tokens.hover} pressedBackground={tokens.pressed} focusColor={tokens.text} radius={tokens.radius.control} {onEvent} />
      <SkipButton direction="next" style={skipStyle} color={tokens.icon} hoverBackground={tokens.hover} pressedBackground={tokens.pressed} focusColor={tokens.text} radius={tokens.radius.control} {onEvent} />
    {/if}

    {#if !isStopped && !foldSpeed && !isAdvert}
      <SpeedButton rates={playbackRates} rate={playbackRate} color={tokens.text} hoverBackground={tokens.hover} pressedBackground={tokens.pressed} focusColor={tokens.text} radius={tokens.radius.control} {onEvent} />
    {/if}

    {#if showOverflow}
      <button
        type="button"
        class="icon-button"
        style="--hover-bg: {tokens.hover}; --pressed-bg: {tokens.pressed}; background: {openMenu === "overflow" ? tokens.pressed : "none"}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label="Options"
        aria-expanded={openMenu === "overflow"}
        on:click={openMenuAt("overflow")}
        on:mouseup={blurElement}
      >
        <DotsThree size={18} color={tokens.icon} />
      </button>
    {/if}

    {#if isPlaylist}
      <button
        type="button"
        class="icon-button"
        style="--hover-bg: {tokens.hover}; --pressed-bg: {tokens.pressed}; background: {queueOpen ? tokens.pressed : "none"}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label={translate("togglePlaylist")}
        aria-expanded={queueOpen}
        on:click={toggleQueue}
        on:mouseup={blurElement}
      >
        <Queue size={22} color={tokens.icon} />
      </button>
    {/if}

    {#if hasInfo && !foldInfo}
      <button
        type="button"
        class="icon-button"
        style="--hover-bg: {tokens.hover}; --pressed-bg: {tokens.pressed}; background: {infoOpen ? tokens.pressed : "none"}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label="About this audio"
        aria-expanded={infoOpen}
        on:click={toggleInfo}
        on:mouseup={blurElement}
      >
        <Info size={20} color={tokens.icon} />
      </button>
    {/if}

    {#if showChat}
      <div class="chat-divider" style="background: {tokens.divider}"></div>

      <button
        type="button"
        class="chat-button"
        class:orb-only={!chatLabelVisible}
        style="--hover-bg: {tokens.hover}; background: {chatOpen ? tokens.pressed : "none"}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label={chatDisabled ? "Subscribe to chat" : isPlaylist ? "Chat about this playlist" : "Chat about this article"}
        aria-expanded={chatOpen}
        title={chatDisabled ? "Subscribe to chat to our journalism" : undefined}
        on:click={toggleChat}
        on:mouseup={blurElement}
      >
        <Orb size={22} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} dimmed={chatDisabled} />
        {#if chatLabelVisible}
          <span class="chat-label" style="color: {chatDisabled ? tokens.muted : tokens.text}">Chat</span>
          {#if chatDisabled}
            <LockSimple size={13} color={tokens.muted} />
          {:else}
            <span class="chat-caret" class:flipped={chatOpen}>
              <CaretDown size={14} color={tokens.muted} />
            </span>
          {/if}
        {/if}
      </button>
    {/if}

    {#if isWidget && showClose}
      <button
        type="button"
        class="icon-button"
        style="--hover-bg: {tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label={translate("closeWidget")}
        on:click={handleCloseWidget}
        on:mouseup={blurElement}
      >
        <Close size={14} color={tokens.muted} />
      </button>
    {/if}
  </div>

  {#if infoOpen && hasInfo}
    <div class="chat-unfold" transition:slide|local={{ duration: infoOpen ? unfoldMs : collapseMs, easing: cubicOut }}>
      <div class="hairline" style="background: {tokens.divider}"></div>
      <div class="info-box">
        <span class="info-copy" style="color: {tokens.text}">{infoText}</span>
      </div>
    </div>
  {/if}

  {#if queueOpen && isPlaylist}
    <div class="hairline" style="background: {tokens.divider}"></div>
    <QueuePanel {content} {contentIndex} {summary} {tokens} {onEvent} />
  {/if}

  {#if chatOpen && showChat && chatDisabled}
    <div class="chat-unfold" transition:slide|local={{ duration: chatOpen ? unfoldMs : collapseMs, easing: cubicOut }}>
      <div class="hairline" style="background: {tokens.divider}"></div>
      <div class="locked-pitch">
        <span class="pitch-copy" style="color: {tokens.text}">Ask questions about our journalism, get context, go deeper.</span>
        <a class="pitch-link" href="#subscribe" style="color: {tokens.link}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}">Subscribe to chat</a>
      </div>
    </div>
  {:else if chatOpen && showChat}
    <div class="chat-unfold" transition:slide|local={{ duration: chatOpen ? unfoldMs : collapseMs, easing: cubicOut }}>
      <div class="hairline" style="background: {tokens.divider}"></div>
      <ChatPanel
        {tokens}
        {agentClient}
        {agentPlaceholder}
        {agentVoice}
        {agentAccess}
        {agentLimit}
        {shortcuts} />
    </div>
  {/if}

  {#if openMenu}
    <Menu groups={menuGroups} left={menuLeft} {tokens} onSelect={handleMenuSelect} onClose={() => openMenu = null} />
  {/if}
  {/if}

</div>

{#if !isWidget && showCaption && !agentOnly}
  <div class="caption outside">
    <span class="caption-left">
      {#if disclosureText && disclosureLink}
        <a class="caption-link" href={disclosureLink} target="_blank" rel="noopener noreferrer" style="color: {captionColor}; border-bottom-color: {captionColor}; outline-color: {captionColor}">{disclosureText}</a>
      {:else if disclosureText}
        <span class="caption-text" style="color: {captionColor}">{disclosureText}</span>
      {/if}
    </span>
    {#if logoIconEnabled}
      <a class="caption-link" href={attributionHref} target="_blank" rel="noopener" style="color: {captionColor}; border-bottom-color: {captionColor}; outline-color: {captionColor}" aria-label={translate("visitBeyondWords")}>Powered by BeyondWords</a>
    {/if}
  </div>
{/if}
</div>

<style>
  .default-player {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .default-player :global(*) {
    font-family: "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  .surface {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: visible;
  }

  .default-player.fixed {
    position: fixed;
    bottom: var(--fixed-margin);
    z-index: 999999;
  }

  .default-player.fixed-left {
    left: var(--fixed-margin);
  }

  .default-player.fixed-center {
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }

  .default-player.fixed-right {
    right: var(--fixed-margin);
  }

  .default-player.docked {
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0;
  }

  .default-player.docked .surface {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .caption {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .caption.outside {
    padding: 6px 8px 0;
  }

  .caption-left {
    display: flex;
    min-width: 0;
  }

  .caption-text,
  .caption-link {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .caption-link {
    text-decoration: none;
    border-bottom-width: 1px;
    border-bottom-style: dotted;
    cursor: pointer;
  }

  .caption-link:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  .info-box {
    padding: 12px 16px;
  }

  .info-copy {
    font-size: 13px;
    line-height: 1.5;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 56px;
    flex-shrink: 0;
    padding: 0 8px;
    box-sizing: border-box;
  }

  .bar.compact {
    gap: 8px;
  }

  .hairline {
    height: 1px;
    flex-shrink: 0;
  }

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
    .play-pause:hover {
      transform: scale(1.04);
    }
  }

  .play-pause:active {
    transform: scale(0.96);
  }

  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    padding: 2px;
    margin: 0;
    background: none;
    border: none;
    cursor: pointer;
  }

  .icon-button:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .icon-button:hover {
      background: var(--hover-bg);
    }
  }

  .chat-divider {
    width: 1px;
    height: 28px;
    flex-shrink: 0;
  }

  .chat-button {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding: 8px 10px;
    margin: 0;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 150ms ease-out;
  }

  .chat-button.orb-only {
    padding: 8px;
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
  }

  .chat-button:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .chat-button:hover {
      background: var(--hover-bg);
    }
  }

  .chat-label {
    font-size: 13px;
    font-weight: 500;
  }

  .chat-caret {
    display: flex;
    transition: transform 160ms ease-out;
  }

  .chat-caret.flipped {
    transform: rotate(180deg);
  }

  .chat-unfold {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .locked-pitch {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
    padding: 12px 16px;
  }

  .pitch-copy {
    font-size: 13px;
    line-height: 1.5;
  }

  .pitch-link {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    font-weight: 500;
    text-decoration: none;
    border-bottom-width: 1px;
    border-bottom-style: dotted;
    cursor: pointer;
  }

  .pitch-link:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  .agent-header {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 56px;
    flex-shrink: 0;
    padding: 0 16px;
    box-sizing: border-box;
  }

  .agent-prompt {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (prefers-reduced-motion: reduce) {
    .chat-caret,
    .chat-button {
      transition: none;
    }
  }

  .title-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .title-col.playing {
    gap: 7px;
  }

  .title {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .title.playing {
    font-size: 13px;
    line-height: 1.2;
    flex: 1;
  }

  .title-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
  }

  .time {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .meta {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .meta .trigger,
  .meta .plain,
  .meta .separator {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .meta .trigger {
    padding: 0;
    margin: 0;
    background: none;
    border: none;
    border-bottom-width: 1px;
    border-bottom-style: dotted;
    cursor: pointer;
  }

  .meta .trigger:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .meta .trigger:hover {
      border-bottom-style: solid;
    }
  }

  .separator {
    opacity: 0.5;
  }

  .advert-link {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .advert-link:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  .ad-badge {
    flex-shrink: 0;
    padding: 2px 5px;
    border-width: 1px;
    border-style: solid;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .persistent-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 4px 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
  }

  .persistent-chip:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .persistent-chip:hover {
      background: var(--hover-bg);
    }
  }

  .offline-note {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
</style>
