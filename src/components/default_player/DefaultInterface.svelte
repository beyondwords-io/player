<!-- svelte-ignore unused-export-let -->
<script>
  // Loads dist/style.js, which injects the player CSS and un-hides the target.
  // Without this a built default-style embed is invisible (see UserInterface).
  import("../../helpers/loadTheStyles.ts");
  import { onMount } from "svelte";
  import ResizeObserver from "resize-observer-polyfill";
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
  import { contentVariantHasSection } from "../../helpers/contentVariants";
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
  import Download from "../svg_icons/default_player/Download.svelte";
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
  export let playlistStyle = "auto-5-4";
  export let playlistToggle = "auto";
  export let downloadFormats = [];
  export let playerTitle = undefined;
  export let titleEnabled = true;
  export let callToAction = undefined;
  export let contentLanguage = "en";
  export let versions = [];
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
  export let segmentLimit = undefined;
  export let segmentLimitReached = false;
  export let accessTier = undefined;
  export let accessCtaText = undefined;
  export let accessCtaUrl = undefined;
  export let agentCtaText = undefined;
  export let agentCtaUrl = undefined;
  export let videoIsBehind = false;
  export let aspectRatio = 16 / 9;

  let element;
  let width = 600;
  let queueOpen = false;
  let appliedPlaylistStyle;
  let chatOpen = false;
  let infoOpen = false;
  let openMenu = null;
  let menuLeft = 8;
  let menuTrigger = undefined;
  let menuAnchorTop = 0;
  let menuAnchorBottom = 0;
  let leaving = false;
  let docked = false;
  let offline = false;
  let hasFinished = false;
  let lastAdvert;
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

  // Painted from the validated token, so an unparseable publisher colour can
  // never leave the surface transparent while the tokens assume a preset.
  $: displayBackground = tokens.background;

  $: contentItem = content[contentIndex] || {};
  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";
  $: isPlaylist = content.length > 1;
  $: progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  $: skipStyle = skipButtonStyle === "auto" ? (isPlaylist ? "tracks" : "segments") : skipButtonStyle;

  // Content access comes from the tier's segment limit: 0 locks the article to
  // its title, a number previews that many segments, anything else is full
  // access. The boundary is where playback will stop - the start of the first
  // segment past the limit.
  // One list holds both variants, so read the article's own segments: the limit
  // is counted in those, and it does not truncate a summary (see
  // withinSegmentLimit in contentVariants).
  $: segments = (contentItem.segments || []).filter(({ section }) => contentVariantHasSection(false, section));
  $: isTitleOnly = segmentLimit === 0 && !summary;
  $: isPreview = typeof segmentLimit === "number" && segmentLimit > 0 && !summary;
  $: previewEndsAt = isPreview ? (segments[segmentLimit]?.startTime ?? 0) : 0;
  $: previewEnded = isPreview && segmentLimitReached;

  $: showTierCta = isTitleOnly || (isPreview && previewEnded && isStopped);
  $: tierCtaText = accessCtaText || stoppedTitle;

  // The agent's own CTA, inheriting the content one when the publisher sells
  // both together. Nothing here is invented: with no copy there is no pitch.
  $: agentCta = agentCtaText || accessCtaText;
  $: agentCtaHref = agentCtaUrl || accessCtaUrl;

  // The queue is an inline affordance - the widget stays the bar plus x.
  $: queueAvailable = isPlaylist && !isWidget && playlistStyle.split("-")[0] !== "hide";
  $: showQueueToggle = layout.queue;
  $: if (queueAvailable && playlistStyle !== appliedPlaylistStyle) {
    appliedPlaylistStyle = playlistStyle;
    queueOpen = playlistStyle.split("-")[0] === "show";
  }

  // Width folds, driven by the container. Rather than guess thresholds, the
  // widths the controls actually occupy are added up and the row gives things
  // away in the design's order until what is left fits: the finished ad's
  // link, then the optional controls, then speed with the time compressing to
  // remaining-only, then the skips, then the queue. Play, the title/progress
  // column and Chat never fold, though Chat drops to its orb last of all.
  const GAP = 12;
  const PLAY_W = 40;
  const CONTROL_W = 32;
  const SPEED_W = 30;
  const CHIP_W = 108;
  const CHAT_LABEL_W = 102;
  const CHAT_ORB_W = 44;
  const STACKED_COL_W = 76;
  const CENTRED_COL_W = 112;
  const TIER_LOCK_W = 32; // 16px glyph plus the 8px either side the design gives it

  $: centredTrack = !isStopped && !isAdvert && !offline && !playingTitle;

  $: widthNeededFor = (plan) => GAP + 16 + PLAY_W
    + GAP + (centredTrack ? CENTRED_COL_W : STACKED_COL_W)
    + (plan.chip ? GAP + CHIP_W : 0)
    + (plan.skips ? 2 * (GAP + CONTROL_W) : 0)
    + (plan.speed ? GAP + SPEED_W : 0)
    + (showTierCta ? TIER_LOCK_W : 0)
    + (plan.overflow ? GAP + CONTROL_W : 0)
    + (plan.queue ? GAP + CONTROL_W : 0)
    + (plan.download ? GAP + CONTROL_W : 0)
    + (plan.info ? GAP + CONTROL_W : 0)
    + (showChat ? GAP + 1 + GAP + (plan.chatLabel ? CHAT_LABEL_W : CHAT_ORB_W) : 0)
    + (isWidget && showClose ? GAP + CONTROL_W : 0);

  $: layout = (() => {
    const plan = {
      chip: canShowAdvertChip,
      skips: !isStopped && !isAdvert,
      speed: !isStopped && !isAdvert,
      overflow: !isStopped && hasVersions,
      queue: queueAvailable && playlistToggle !== "hide",
      download: hasDownload,
      info: hasInfo,
      chatLabel: true,
    };

    // Given away in this order until the bar fits. The controls go first
    // because the overflow menu still holds them; the advertiser chip has
    // nowhere else to go, and it is a paid placement, so it outlives them.
    const giveAway = [
      () => { plan.download = false; plan.info = false; plan.overflow = plan.overflow || hasDownload || hasInfo; },
      () => { plan.speed = false; plan.overflow = plan.overflow || !isStopped; },
      () => { plan.skips = false; plan.overflow = plan.overflow || !isStopped; },
      () => { plan.queue = false; plan.overflow = plan.overflow || (queueAvailable && playlistToggle !== "hide"); },
      () => { plan.chip = false; },
      () => { plan.chatLabel = false; },
    ];

    for (const step of giveAway) {
      if (widthNeededFor(plan) <= width) { break; }
      step();
    }

    return plan;
  })();

  $: showPersistentChipInRow = layout.chip;
  $: foldSkips = !layout.skips;
  $: foldSpeed = !layout.speed;
  $: remainingOnly = !layout.speed && !isStopped;
  $: foldDownload = hasDownload && !layout.download;
  $: foldInfo = hasInfo && !layout.info;
  $: foldQueue = !layout.queue;
  $: chatLabelVisible = layout.chatLabel;

  $: advertHref = ensureProtocol(activeAdvert?.clickThroughUrl || "") || undefined;
  $: advertText = advertHref ? chooseAdvertText(advertHref) : "";

  // The mark and link persist beside the transport once the ad has finished,
  // so the ad that just played is remembered here. The legacy persistentIndex
  // only tracks adverts when persistentAdImage is set, which is off by
  // default, so it can't carry this on its own.
  $: if (isAdvert) { lastAdvert = activeAdvert; }
  $: if (isStopped) { lastAdvert = undefined; }
  $: contentIndex, lastAdvert = undefined;

  $: finishedAdvert = lastAdvert || persistentAdvert;
  $: persistentHref = ensureProtocol(finishedAdvert?.clickThroughUrl || "") || undefined;
  $: persistentText = persistentHref ? chooseAdvertText(persistentHref) : "";
  $: canShowAdvertChip = !isAdvert && !isStopped && !!persistentHref && !!persistentText;
  $: showPersistentChip = canShowAdvertChip && showPersistentChipInRow;
  $: buffering = isPlaying && !metadataLoaded;

  $: if (isPlaying && duration > 0 && currentTime / duration > 0.98) { hasFinished = true; }
  $: if (isPlaying && duration > 0 && currentTime / duration < 0.5) { hasFinished = false; }

  $: stoppedTitle = hasFinished ? "Listen again" : callToAction || translate("listenToThisArticle");

  // No title shows in the bar during playback unless the publisher opted in
  // through the title setting - a project name isn't worth the row. When the
  // row does carry something (that title, or an advertiser's link) the track
  // moves beneath it; otherwise the track takes the row itself.
  $: playingTitle = titleEnabled ? playerTitle || "" : "";
  $: videoTitle = contentItem.title || playerTitle || stoppedTitle;

  $: totalMins = translate("minutesSingularOrPlural").replace("{n}", Math.max(1, Math.round(duration / 60)));
  // versions restricts what the Version group offers; unset means every
  // variant the content actually has.
  $: offeredVersions = versions.length ? versions : ["full", "summary"];
  $: hasSummaryVariant = !!contentItem.summarization && offeredVersions.includes("summary");
  $: hasVersions = hasSummaryVariant && offeredVersions.includes("full");
  $: languageName = languageNameFor(contentLanguage);
  // Name the version when the reader can switch, since the menu carries the
  // durations; otherwise say how long the one they are getting is.
  $: versionLabel = summary && hasVersions ? "Summary" : totalMins;

  $: downloadAudio = (summary ? contentItem.summarization?.audio : contentItem.audio) || [];
  $: downloadVideo = (summary ? contentItem.summarization?.video : contentItem.video) || [];
  $: [downloadAudioIndex, downloadVideoIndex] = mediaToDownload(downloadFormats, downloadAudio, downloadVideo);
  $: hasDownload = downloadAudioIndex !== -1 || downloadVideoIndex !== -1;

  $: hasInfo = !!infoText;
  $: showOverflow = (!isStopped && (hasVersions || foldSpeed)) || (hasInfo && foldInfo) || (hasDownload && foldDownload) || (queueAvailable && foldQueue && playlistToggle !== "hide");

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

  // full | limited | locked | off, with the earlier enabled/disabled spellings
  // normalised here so the rest of the subtree only sees the four names.
  $: access = agentAccess === "enabled" ? "full" : agentAccess === "disabled" ? "locked" : agentAccess;

  $: showChat = embedMode !== "audio" && access !== "off" && !isAdvert;
  $: isAdvert && (chatOpen = false);
  $: chatDisabled = access === "locked";
  $: agentOnly = embedMode === "agent";
  $: agentPrompt = agentName ? `Ask ${agentName}` : "Ask about this article, or anything we've covered";

  $: playPauseLabel = isPlaying ? translate("pauseAudio") : translate("playAudio");

  $: versionItems = [
    ...(offeredVersions.includes("full") ? [{ value: "full", label: "Full", secondary: formatMins(mediaDuration(contentItem)), selected: !summary }] : []),
    ...(hasSummaryVariant ? [{ value: "summary", label: "Summary", secondary: formatMins(mediaDuration(contentItem.summarization)), selected: summary }] : []),
  ];

  // The API doesn't yet serialize a top-level duration on summarization (and
  // sometimes content), so fall back to the first media variant's duration,
  // which is in milliseconds. See S-8883.
  const mediaDuration = (object) => {
    if (!object) { return 0; }
    if (object.duration) { return object.duration; }

    const media = object.audio?.[0] || object.video?.[0];
    return media?.duration ? media.duration / 1000 : 0;
  };

  $: speedItems = [{ value: "speed", label: "Speed", secondary: `${playbackRate}×`, selected: false, keepOpen: true }];

  $: menuGroups =
    openMenu === "version" ? [{ label: "Version", items: versionItems }] :
    openMenu === "overflow" ? [
      ...(hasVersions && !isStopped ? [{ label: "Version", items: versionItems }] : []),
      ...(foldSpeed && !isStopped ? [{ label: "Speed", items: speedItems }] : []),
      ...(hasInfo && foldInfo ? [{ label: "About", items: [{ value: "info", label: "About this audio", selected: infoOpen }] }] : []),
      ...(hasDownload && foldDownload ? [{ label: "Download", items: [{ value: "download", label: translate("downloadAudio"), selected: false }] }] : []),
      ...(queueAvailable && foldQueue && playlistToggle !== "hide" ? [{ label: "Queue", items: [{ value: "queue", label: translate("togglePlaylist"), selected: queueOpen }] }] : []),
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

    // Never a dead control: with the article locked to its title, play is the
    // upgrade action.
    if (isTitleOnly) {
      if (accessCtaUrl) { window.open(accessCtaUrl, "_blank", "noopener"); }
      return;
    }

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

    // Where the menu hangs from, so it stays with its trigger however tall the
    // player has grown, e.g. with the queue or the chat panel open.
    menuAnchorTop = anchor.top - root.top;
    menuAnchorBottom = anchor.bottom - root.top;

    // The menu ignores presses on its own trigger, so that a second press
    // closes it here rather than being treated as a press outside.
    menuTrigger = event.currentTarget;
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
    } else if (item.value === "download") {
      handleDownload();
    } else if (item.value === "queue") {
      toggleQueue();
    }
  };

  const mediaToDownload = (formats, audio, video) => {
    for (const format of formats || []) {
      for (const [i, item] of (audio || []).entries()) {
        if (item.url?.endsWith(`.${format}`)) { return [i, -1]; }
      }

      for (const [i, item] of (video || []).entries()) {
        if (item.url?.endsWith(`.${format}`)) { return [-1, i]; }
      }
    }

    return [-1, -1];
  };

  const handleDownload = () => {
    onEvent(newEvent({
      type: "PressedDownload",
      description: "The download button was pressed.",
      initiatedBy: "user",
      contentIndex,
      audioIndex: downloadAudioIndex,
      videoIndex: downloadVideoIndex,
      summary,
    }));
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

  // The <video> element lives in MediaElement, behind this component, so its
  // corners are matched through a custom property on the shared host element.
  $: mediaRadius = chatOpen && showChat
    ? `${tokens.radius.bar} ${tokens.radius.bar} 0 0`
    : tokens.radius.bar;

  $: host = element?.closest(".beyondwords-player, .beyondwords-widget");
  $: if (host) {
    if (videoIsBehind) {
      host.style.setProperty("--beyondwords-media-radius", mediaRadius);
    } else {
      host.style.removeProperty("--beyondwords-media-radius");
    }
  }

  const handleRootKeydown = (event) => {
    if (event.key !== "Escape") { return; }

    chatOpen = false;
    infoOpen = false;
    queueOpen = false;
    openMenu = null;
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
  class:leaving
  style="--fixed-margin: {fixedMargin || "16px"}; width: {widthStyle};"
  in:fly|global={{ y: isFixed ? 12 : 0, duration: isFixed ? (reduceMotion ? 0 : 200) : 0, easing: cubicOut }}
  out:fade|global={{ duration: isFixed && !reduceMotion ? 150 : 0 }}
  on:outrostart={() => leaving = true}
  on:outroend={() => leaving = false}
  on:keydown={handleRootKeydown}
  role="none"
>
<div class="surface" style="background: {videoIsBehind ? "transparent" : displayBackground}; border-radius: {surfaceRadius}; box-shadow: {videoIsBehind ? "none" : surfaceShadow};">
  {#if videoIsBehind && !agentOnly}
    <VideoFrame
      {tokens}
      {aspectRatio}
      {playbackState}
      {duration}
      {currentTime}
      title={videoTitle}
      {showChat}
      {chatOpen}
      onToggleChat={toggleChat}
      {isWidget}
      showClose={isWidget && showClose}
      onClose={handleCloseWidget}
      {onEvent} />

    {#if chatOpen && showChat}
      <div
        class="chat-unfold"
        style="background: {displayBackground}; border-radius: 0 0 {tokens.radius.bar} {tokens.radius.bar}"
        transition:slide|local={{ duration: chatOpen ? unfoldMs : collapseMs, easing: cubicOut }}
      >
        <ChatPanel
          {tokens}
          {agentClient}
          {agentPlaceholder}
          {agentVoice}
          agentAccess={access}
          {agentLimit}
          {shortcuts}
          {isPlaying}
          {onEvent}
          ctaText={agentCta}
          ctaUrl={agentCtaHref}
          emptyStateChips={true} />
      </div>
    {/if}
  {:else if agentOnly}
    <div class="agent-header">
      <Orb size={24} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} />
      <span class="agent-prompt" style="color: {tokens.text}">{agentPrompt}</span>
    </div>
    <div class="hairline" style="background: {tokens.divider}"></div>

    <!-- Locked is handled inside the panel: the reader can still ask, and the
         answer is the publisher's offer with their question above it. -->
    <ChatPanel
      {tokens}
      {agentClient}
      {agentPlaceholder}
      {agentVoice}
      agentAccess={access}
      {agentLimit}
      {shortcuts}
      {isPlaying}
      {onEvent}
      ctaText={agentCta}
      ctaUrl={agentCtaHref}
      showSlashButton={false}
      emptyStateChips={true} />
  {:else}
  <div class="bar" class:compact={foldSkips}>
    <Visibility {onEvent} enabled={!isWidget} bind:isVisible bind:relativeY bind:absoluteY>
      <button
        type="button"
        class="play-pause"
        style="color: {tokens.icon}; outline-color: {tokens.text}"
        aria-label={isTitleOnly ? tierCtaText : playPauseLabel}
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
      {#if isStopped && showTierCta}
        {#if accessCtaUrl}
          <a class="title tier-cta" href={accessCtaUrl} target="_blank" rel="noopener noreferrer" style="color: {tokens.link}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}">{tierCtaText}</a>
        {:else}
          <span class="title" style="color: {tokens.text}">{tierCtaText}</span>
        {/if}
      {:else if isStopped}
        <span class="title" style="color: {tokens.text}">{stoppedTitle}</span>
        <span class="meta">
          {#if hasVersions}
            <button type="button" class="trigger" style="color: {tokens.muted}; border-bottom-color: {tokens.underline}; outline-color: {tokens.text}" on:click={openMenuAt("version")} aria-expanded={openMenu === "version"}>{versionLabel}</button>
          {:else}
            <span class="plain" style="color: {tokens.muted}">{versionLabel}</span>
          {/if}

          <span class="separator" style="color: {tokens.muted}">·</span>

          <span class="plain" style="color: {tokens.muted}">{languageName}</span>
        </span>
      {:else if isAdvert}
        <div class="title-row">
          {#if advertHref && advertText}
            <a class="advert-link" href={advertHref} target="_blank" rel="noopener noreferrer" style="color: {tokens.text}; outline-color: {tokens.text}">{advertText}</a>
          {:else}
            <span class="title playing" style="color: {tokens.text}">{playingTitle}</span>
          {/if}
          <span class="time" style="color: {tokens.text}" role="status" aria-live="polite">{formatTime(Math.max(0, duration - currentTime))} left</span>
          <span class="ad-badge" style="color: {tokens.muted}; border-color: {tokens.underline}" role="img" aria-label="Advertisement">AD</span>
        </div>
        <ProgressTrack
          {progress}
          {duration}
          readonly={true}
          radius={tokens.radius.track}
          trackColor={tokens.track}
          fillColor={tokens.text}
          focusColor={tokens.text}
          {onEvent} />
      {:else if offline}
        <div class="title-row">
          {#if playingTitle}
            <span class="title playing" style="color: {tokens.text}; opacity: 0.4">{playingTitle}</span>
          {/if}
          <span class="offline-note" style="color: {tokens.muted}">
            <WifiSlash size={12} color={tokens.muted} />
            Offline — will resume
          </span>
        </div>
        <ProgressTrack
          {progress}
          {duration}
          readonly={true}
          radius={tokens.radius.track}
          trackColor={tokens.track}
          fillColor={tokens.text}
          fillOpacity={0.4}
          focusColor={tokens.text}
          {onEvent} />
      {:else if playingTitle}
        <div class="title-row">
          <span class="title playing" style="color: {tokens.text}">{playingTitle}</span>
          {#if isPreview && !remainingOnly}
            <span class="time" style="color: {tokens.text}">{formatTime(currentTime)} / {formatTime(previewEndsAt)}</span>
          {:else if isPreview}
            <span class="time" style="color: {tokens.text}">-{formatTime(Math.max(0, previewEndsAt - currentTime))}</span>
          {:else if remainingOnly}
            <span class="time" style="color: {tokens.text}">-{formatTime(duration - currentTime)}</span>
          {:else}
            <span class="time" style="color: {tokens.text}">{formatTime(currentTime)} / {formatTime(duration)}</span>
          {/if}
        </div>
        <ProgressTrack
          {progress}
          {duration}
          {buffering}
          radius={tokens.radius.track}
          trackColor={tokens.track}
          fillColor={tokens.text}
          focusColor={tokens.text}
          {onEvent} />
      {:else}
        <div class="progress-row">
          <div class="progress-grow">
            <ProgressTrack
              {progress}
              {duration}
              {buffering}
              thickness={6}
              radius={tokens.radius.track}
              trackColor={tokens.track}
              fillColor={tokens.text}
              focusColor={tokens.text}
              {onEvent} />
          </div>
          {#if isPreview && !remainingOnly}
            <span class="time" style="color: {tokens.text}">{formatTime(currentTime)} / {formatTime(previewEndsAt)}</span>
          {:else if isPreview}
            <span class="time" style="color: {tokens.text}">-{formatTime(Math.max(0, previewEndsAt - currentTime))}</span>
          {:else if remainingOnly}
            <span class="time" style="color: {tokens.text}">-{formatTime(duration - currentTime)}</span>
          {:else}
            <span class="time" style="color: {tokens.text}">{formatTime(currentTime)} / {formatTime(duration)}</span>
          {/if}
        </div>
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
        style="--bg: {openMenu === "overflow" ? tokens.pressed : "transparent"}; --hover-bg: {openMenu === "overflow" ? tokens.pressed : tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label="Options"
        aria-expanded={openMenu === "overflow"}
        on:click={openMenuAt("overflow")}
        on:mouseup={blurElement}
      >
        <DotsThree size={18} color={tokens.icon} />
      </button>
    {/if}

    {#if showQueueToggle}
      <button
        type="button"
        class="icon-button"
        style="--bg: {queueOpen ? tokens.pressed : "transparent"}; --hover-bg: {queueOpen ? tokens.pressed : tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label={translate("togglePlaylist")}
        aria-expanded={queueOpen}
        on:click={toggleQueue}
        on:mouseup={blurElement}
      >
        <Queue size={22} color={tokens.icon} />
      </button>
    {/if}

    {#if hasDownload && !foldDownload}
      <button
        type="button"
        class="icon-button"
        style="--hover-bg: {tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label={translate("downloadAudio")}
        on:click={handleDownload}
        on:mouseup={blurElement}
      >
        <Download size={22} color={tokens.icon} />
      </button>
    {/if}

    {#if hasInfo && !foldInfo}
      <button
        type="button"
        class="icon-button"
        style="--bg: {infoOpen ? tokens.pressed : "transparent"}; --hover-bg: {infoOpen ? tokens.pressed : tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label="About this audio"
        aria-expanded={infoOpen}
        on:click={toggleInfo}
        on:mouseup={blurElement}
      >
        <Info size={20} color={tokens.icon} />
      </button>
    {/if}

    {#if showTierCta}
      <span class="tier-lock" aria-hidden="true">
        <LockSimple size={16} color={tokens.muted} />
      </span>
    {/if}

    {#if showChat}
      <div class="chat-divider" style="background: {tokens.divider}"></div>

      <button
        type="button"
        class="chat-button"
        class:orb-only={!chatLabelVisible}
        style="--bg: {chatOpen ? tokens.pressed : "transparent"}; --hover-bg: {chatOpen ? tokens.pressed : tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label={(chatDisabled && agentCta) || (isPlaylist ? "Chat about this playlist" : "Chat about this article")}
        aria-expanded={chatOpen}
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

  {#if queueOpen && queueAvailable}
    <div class="hairline" style="background: {tokens.divider}"></div>
    <QueuePanel {content} {contentIndex} {summary} {tokens} {onEvent} />
  {/if}

  {#if chatOpen && showChat}
    <div class="chat-unfold" transition:slide|local={{ duration: chatOpen ? unfoldMs : collapseMs, easing: cubicOut }}>
      <div class="hairline" style="background: {tokens.divider}"></div>
      <ChatPanel
        {tokens}
        {agentClient}
        {agentPlaceholder}
        {agentVoice}
        agentAccess={access}
        {agentLimit}
        ctaText={agentCta}
        ctaUrl={agentCtaHref}
        {shortcuts}
        {isPlaying}
        {onEvent}
        emptyStateChips={true} />
    </div>
  {/if}

  {#if openMenu}
    <Menu groups={menuGroups} left={menuLeft} anchorTop={menuAnchorTop} anchorBottom={menuAnchorBottom} {tokens} trigger={menuTrigger} onSelect={handleMenuSelect} onClose={() => openMenu = null} />
  {/if}
  {/if}

</div>

{#if !isWidget && showCaption && !agentOnly}
  <div class="caption outside">
    <span class="caption-left">
      {#if disclosureText && disclosureLink}
        <a class="caption-link" href={disclosureLink} target="_blank" rel="noopener noreferrer" style="color: {captionColor}; border-bottom-color: {captionColor}; outline-color: {captionColor}; --hover-color: {tokens.text}">{disclosureText}</a>
      {:else if disclosureText}
        <span class="caption-text" style="color: {captionColor}">{disclosureText}</span>
      {/if}
    </span>
    {#if logoIconEnabled}
      <a class="caption-link" href={attributionHref} target="_blank" rel="noopener" style="color: {captionColor}; border-bottom-color: {captionColor}; outline-color: {captionColor}; --hover-color: {tokens.text}" aria-label={translate("visitBeyondWords")}>Powered by BeyondWords</a>
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

  /* A widget that has been closed fades for 150ms, and Svelte keeps it in the
     DOM until that finishes. It is fixed at the bottom of the window with a
     very high z-index, so while it is invisible it would still take the clicks
     aimed at whatever is now underneath it. */
  .default-player.leaving {
    pointer-events: none;
  }

  /* Fullscreen: the player is a flex item of a black flex container, so it has
     to claim the space before the frame's own 100% means anything. Without this
     it shrinks to fit and the video comes out a fraction of the screen. */
  :global(.beyondwords-player.maximized) .default-player {
    width: 100%;
    height: 100%;
  }

  :global(.beyondwords-player.maximized) .surface {
    height: 100%;
  }

  /* Nothing but the picture in fullscreen. */
  :global(.beyondwords-player.maximized) .caption.outside {
    display: none;
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

  /* The widget sits at the bottom of the viewport, so its attachments open
     upward: column-reverse puts the bar at the bottom and stacks the queue,
     info box and conversation above it, dividers included. */
  .default-player.fixed .surface {
    flex-direction: column-reverse;
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

  @media (hover: hover) and (pointer: fine) {
    .caption-link:hover {
      color: var(--hover-color);
      border-bottom-color: var(--hover-color);
    }
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
    /* Required: it is the containing block for the touch floor below. Without
       it the pseudo-element resolves against .default-player and covers the
       whole bar, swallowing every click. */
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

  /* Keeps the 44px touch floor without changing the visual size. */
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
    .icon-button:hover {
      background: var(--hover-bg);
    }
  }

  .icon-button:active {
    background: var(--pressed-bg);
  }

  /* Closes a locked bar, per the access-tier states in the design. */
  .tier-lock {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding: 0 8px;
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
    background: var(--bg, transparent);
    border: none;
    cursor: pointer;
    transition: background 150ms ease-out;
  }

  .chat-button.orb-only {
    /* border-box, or the 44px touch floor is added to the padding and the
       button grows to 60px: taller than the 56px bar, so the caption row below
       ends up covering its bottom edge and taking the tap. */
    box-sizing: border-box;
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

  .chat-button:active {
    background: var(--pressed-bg);
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





  .agent-header {
    /* The lock sits after the prompt, so the row has to make room for it. */
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
    .chat-button,
    .play-pause {
      transition: none;
    }

    .play-pause:hover,
    .play-pause:active {
      transform: none;
    }
  }

  .title-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    flex: 1;
    min-width: 100px;
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

  .progress-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .progress-grow {
    flex: 1;
    min-width: 40px;
  }


  .time {
    flex-shrink: 0;
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
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  /* The whole label is the upgrade link when there is somewhere to send them. */
  .title.tier-cta {
    width: fit-content;
    max-width: 100%;
    text-decoration: none;
    border-bottom-style: dotted;
    border-bottom-width: 1px;
    cursor: pointer;
  }

  .meta .tier-cta {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-decoration: none;
    border-bottom-width: 1px;
    border-bottom-style: dotted;
    cursor: pointer;
  }

  .meta .tier-cta:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
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
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .persistent-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 1;
    min-width: 0;
    max-width: 40%;
    white-space: nowrap;
    overflow: hidden;
    padding: 4px 6px;
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
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
</style>
