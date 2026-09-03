<script lang="ts">
  // Loads dist/style.js, which injects the player CSS and un-hides the target.
  // Without this a built default-style embed is invisible (see UserInterface).
  // The build replaces this external marker with the generated style bundle.
  // @ts-expect-error TypeScript disallows explicit .ts imports without a project config.
  import("../../helpers/loadTheStyles.ts");
  import { onDestroy, onMount } from "svelte";
  import ResizeObserver from "resize-observer-polyfill";
  import { slide, fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";
  import deriveTokens from "../../helpers/default_theme/deriveTokens";
  import { mergePresent, resolveThemePreference } from "../../helpers/default_theme/palettes";
  import { luminance, parseColor } from "../../helpers/default_theme/colorMath";
  import chooseAdvertText from "../../helpers/chooseAdvertText";
  import ensureProtocol from "../../helpers/ensureProtocol";
  import formatTime from "../../helpers/formatTime";
  import planDefaultPlayerLayout, { DEFAULT_PLAYER_LAYOUT_MEASUREMENTS } from "../../helpers/defaultPlayerLayout";
  import { resolveFixedWidgetGeometry } from "../../helpers/defaultWidgetGeometry";
  import { mediaQueryMatches, subscribeMediaQuery } from "../../helpers/mediaQuery";
  import { contentVariantHasSection } from "../../helpers/contentVariants";
  import CaretDown from "../svg_icons/default_player/CaretDown.svelte";
  import SkipButton from "./SkipButton.svelte";
  import SpeedButton from "./SpeedButton.svelte";
  import Menu from "./Menu.svelte";
  import QueuePanel from "./QueuePanel.svelte";
  import ChatPanel from "./ChatPanel.svelte";
  import DefaultCaption from "./DefaultCaption.svelte";
  import DefaultPlayPauseButton from "./DefaultPlayPauseButton.svelte";
  import DefaultPlaybackMetadata from "./DefaultPlaybackMetadata.svelte";
  import DefaultUtilityControls from "./DefaultUtilityControls.svelte";
  import Orb from "./Orb.svelte";
  import VideoFrame from "./VideoFrame.svelte";
  import Visibility from "../helpers/Visibility.svelte";
  import LockSimple from "../svg_icons/default_player/LockSimple.svelte";

  export let onEvent: (event?: unknown) => void = () => {};
  export let agentClient;
  export let embedMode = "audio";
  export let theme = "light";
  export let systemDark = false;
  export let lightTheme = {};
  export let darkTheme = {};
  export let videoTheme = {};
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
  export let variants = [];
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
  export let agentQuestionsLimit = null;
  export let agentVoiceSecondsLimit = null;
  export let agentQuestionsRemaining = null;
  export let agentVoiceSecondsRemaining = null;
  export let onAgentQuestion = () => {};
  export let agentVoice = true;
  export let agentPlaceholder = undefined;
  export let agentName = undefined;
  export let shortcuts = [];
  export let infoText = undefined;
  export let disclosureText = undefined;
  export let disclosureLink = undefined;
  export let logoIconEnabled = true;
  export let activeAdvert = undefined;
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
  export let accessCtaText = undefined;
  export let accessCtaUrl = undefined;
  export let agentCtaText = undefined;
  export let agentCtaUrl = undefined;
  export let videoIsBehind = false;
  export let aspectRatio = 16 / 9;

  let element;
  let chatWidthSizer;
  let width = 600;
  let fullChatWidth = 102;
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
  let transitionsRunning = 0;
  let docked = false;
  let offline = false;
  let hasFinished = false;
  let lastAdvert;
  let pageBackground = "#ffffff";

  // A collapsed panel does not end a call - the bar says one is running.
  $: callLive = $agentClient.kind === "voice";

  const reduceMotion = mediaQueryMatches("(prefers-reduced-motion: reduce)");
  const animationWindow = typeof window === "undefined"
    ? undefined
    : window as Window & { disableAnimation?: boolean };
  $: unfoldMs = reduceMotion || animationWindow?.disableAnimation ? 0 : 240;
  $: collapseMs = reduceMotion || animationWindow?.disableAnimation ? 0 : 180;

  $: isAdvert = !!activeAdvert && playbackState !== "stopped";

  $: resolvedAdvertTheme = resolveThemePreference(activeAdvert?.theme, systemDark);
  $: playerPalette = theme === "dark" ? darkTheme : lightTheme;
  $: advertPalette = resolvedAdvertTheme === "dark" ? activeAdvert?.darkTheme : activeAdvert?.lightTheme;
  $: selectedTheme = isAdvert ? resolvedAdvertTheme : theme;

  // Deprecated flat props remain available to direct component consumers.
  // Player.svelte has already folded its public flat aliases into the named
  // palettes, so it intentionally does not pass them here.
  $: legacyOverrides = Object.fromEntries(Object.entries({
    textColor, backgroundColor, iconColor, highlightColor, wordHighlightColor,
    videoTextColor, videoIconColor, agentColor, accentColor, accentTextColor,
  }).filter(([, value]) => value !== undefined && value !== null));
  $: advertLegacyPalette = {
    textColor: activeAdvert?.textColor,
    backgroundColor: activeAdvert?.backgroundColor,
    iconColor: activeAdvert?.iconColor,
  };
  $: advertLegacyVideoTheme = {
    textColor: activeAdvert?.videoTextColor,
    backgroundColor: activeAdvert?.videoBackgroundColor,
    iconColor: activeAdvert?.videoIconColor,
  };
  $: selectedPalette = isAdvert
    ? mergePresent(legacyOverrides, advertLegacyPalette, advertPalette)
    : playerPalette;
  $: selectedVideoTheme = isAdvert
    ? mergePresent(advertLegacyVideoTheme, activeAdvert?.videoTheme)
    : videoTheme;

  $: tokens = deriveTokens({
    theme: selectedTheme,
    radius,
    palette: selectedPalette,
    videoTheme: selectedVideoTheme,
    overrides: isAdvert ? {} : legacyOverrides,
    agentAvatar,
    pageDark,
    pageBackground,
  });

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
  // away until what is left fits: the optional controls, then speed with the
  // time compressing to remaining-only, then the skips, then the queue, then
  // the finished ad's link. Play, the title/progress column and Chat never
  // fold, though Chat drops to its orb last of all.
  $: centredTrack = !isStopped && !isAdvert && !offline && !playingTitle;
  $: layout = planDefaultPlayerLayout({
    availableWidth: width,
    availability: {
      chat: showChat,
      chip: canShowAdvertChip,
      close: isWidget && showClose,
      download: hasDownload,
      info: hasInfo,
      overflow: !isStopped && hasVariants,
      queue: queueAvailable && playlistToggle !== "hide",
      showTierCta,
      skips: !isStopped && !isAdvert,
      speed: !isStopped && !isAdvert,
      transport: !isStopped,
    },
    centredTrack,
    measurements: { ...DEFAULT_PLAYER_LAYOUT_MEASUREMENTS, chatLabel: fullChatWidth },
  });

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

  $: stoppedTitle = hasFinished ? translate("listenAgain") : callToAction || translate("listenToThisArticle");

  // No title shows in the bar during playback unless the publisher opted in
  // through the title setting - a project name isn't worth the row. When the
  // row does carry something (that title, or an advertiser's link) the track
  // moves beneath it; otherwise the track takes the row itself.
  $: playingTitle = titleEnabled ? playerTitle || "" : "";
  $: videoTitle = contentItem.title || playerTitle || stoppedTitle;

  $: totalMins = translate("minutesSingularOrPlural").replace("{n}", String(Math.max(1, Math.round(duration / 60))));
  // variants restricts what the Version group offers; unset means every
  // variant the content actually has.
  $: offeredVariants = variants.length ? variants : ["article", "summary"];
  $: hasSummaryVariant = !!contentItem.summarization && offeredVariants.includes("summary");
  $: hasVariants = hasSummaryVariant && offeredVariants.includes("article");
  // Name the version when the reader can switch, since the menu carries the
  // durations; otherwise say how long the one they are getting is.
  $: versionLabel = summary && hasVariants ? translate("summary") : totalMins;

  $: downloadAudio = (summary ? contentItem.summarization?.audio : contentItem.audio) || [];
  $: downloadVideo = (summary ? contentItem.summarization?.video : contentItem.video) || [];
  $: [downloadAudioIndex, downloadVideoIndex] = mediaToDownload(downloadFormats, downloadAudio, downloadVideo);
  $: hasDownload = downloadAudioIndex !== -1 || downloadVideoIndex !== -1;

  $: hasInfo = !!infoText;
  $: showOverflow = (!isStopped && (hasVariants || foldSpeed)) || (hasInfo && foldInfo) || (hasDownload && foldDownload) || (queueAvailable && foldQueue && playlistToggle !== "hide");

  $: ({ fixed: isFixed, side: fixedSide, widthStyle } = resolveFixedWidgetGeometry({
    docked,
    isWidget,
    margin: fixedMargin,
    position: fixedPosition,
    width: fixedWidth,
  }));

  $: surfaceRadius = docked && isFixed ? "12px 12px 0 0" : tokens.radius.bar;
  $: surfaceShadow = docked && isFixed ? "0 -2px 8px rgba(0, 0, 0, 0.12)" :
    isFixed ? tokens.widgetShadow : tokens.barRing;

  $: showCaption = !!disclosureText || logoIconEnabled;
  $: pageDark = luminance(pageBackground) < 0.35;
  $: captionColor = tokens.secondary;
  $: attributionHref = typeof window === "undefined" ? "https://beyondwords.io" :
    `https://beyondwords.io/?utm_source=${encodeURIComponent(window.location.origin)}&utm_medium=player&utm_campaign=${analyticsId || ""}`;

  $: agentTextAvailable = agentQuestionsRemaining === null || agentQuestionsRemaining > 0;
  $: agentVoiceAvailable = agentVoice && (agentVoiceSecondsRemaining === null || agentVoiceSecondsRemaining > 0);
  $: showChat = embedMode !== "audio" && !isAdvert;
  $: isAdvert && (chatOpen = false);
  $: chatDisabled = !agentTextAvailable && !agentVoiceAvailable;
  $: agentOnly = embedMode === "agent";
  $: agentPrompt = agentName
    ? translate("askAgent").replace("{name}", agentName)
    : translate("askAboutThisArticle");

  $: playPauseLabel = isPlaying ? translate("pauseAudio") : translate("playAudio");

  $: versionItems = [
    ...(offeredVariants.includes("article") ? [{ value: "article", label: translate("full"), secondary: formatMins(mediaDuration(contentItem)), selected: !summary }] : []),
    ...(hasSummaryVariant ? [{ value: "summary", label: translate("summary"), secondary: formatMins(mediaDuration(contentItem.summarization)), selected: summary }] : []),
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

  $: speedItems = [{ value: "speed", label: translate("speed"), secondary: `${playbackRate}×`, selected: false, keepOpen: true }];

  $: menuGroups =
    openMenu === "version" ? [{ label: translate("version"), items: versionItems }] :
    openMenu === "overflow" ? [
      ...(hasVariants && !isStopped ? [{ label: translate("version"), items: versionItems }] : []),
      ...(foldSpeed && !isStopped ? [{ label: translate("speed"), items: speedItems }] : []),
      ...(hasInfo && foldInfo ? [{ label: translate("about"), items: [{ value: "info", label: translate("aboutThisAudio"), selected: infoOpen }] }] : []),
      ...(hasDownload && foldDownload ? [{ label: translate("download"), items: [{ value: "download", label: translate("downloadAudio"), selected: false }] }] : []),
      ...(queueAvailable && foldQueue && playlistToggle !== "hide" ? [{ label: translate("queue"), items: [{ value: "queue", label: translate("togglePlaylist"), selected: queueOpen }] }] : []),
    ] : [];

  const formatMins = (seconds) => {
    if (!seconds) { return undefined; }
    return translate("minutesSingularOrPlural").replace("{n}", String(Math.max(1, Math.round(seconds / 60))));
  };

  $: timeLabel =
    isPreview && !remainingOnly ? `${formatTime(currentTime)} / ${formatTime(previewEndsAt)}` :
    isPreview ? `-${formatTime(Math.max(0, previewEndsAt - currentTime))}` :
    remainingOnly ? `-${formatTime(duration - currentTime)}` :
    `${formatTime(currentTime)} / ${formatTime(duration)}`;

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
    if (item.value === "article" || item.value === "summary") {
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
    agentClient.endSession();

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
      host.style.setProperty("--beyondwords-video-background", tokens.videoBackground);
    } else {
      host.style.removeProperty("--beyondwords-media-radius");
      host.style.removeProperty("--beyondwords-video-background");
    }
  }
  onDestroy(() => {
    host?.style.removeProperty("--beyondwords-media-radius");
    host?.style.removeProperty("--beyondwords-video-background");
  });

  const handleRootKeydown = (event) => {
    if (event.key !== "Escape") { return; }

    chatOpen = false;
    infoOpen = false;
    queueOpen = false;
    openMenu = null;
  };

  onMount(() => {
    const updateWidths = () => {
      width = element?.clientWidth || width;

      // Unlike the icon controls, the full Chat control contains translated
      // copy. Measure the rendered font instead of budgeting for the English
      // label so changing playerLanguage cannot make the fold plan overflow.
      const measuredChatWidth = chatWidthSizer?.getBoundingClientRect().width;
      if (measuredChatWidth) { fullChatWidth = Math.ceil(measuredChatWidth); }
    };

    const observer = new ResizeObserver(updateWidths);
    if (element) { observer.observe(element); }
    if (chatWidthSizer) { observer.observe(chatWidthSizer); }
    updateWidths();

    const unsubscribeDocked = subscribeMediaQuery("(max-width: 640px)", (matches) => docked = matches);

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
      unsubscribeDocked();
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
  class:animating={transitionsRunning > 0}
  style="--fixed-margin: {fixedMargin || "16px"}; width: {widthStyle};"
  in:fly|global={{ y: isFixed ? 12 : 0, duration: isFixed ? unfoldMs && 200 : 0, easing: cubicOut }}
  out:fade|global={{ duration: isFixed ? unfoldMs && 150 : 0 }}
  on:introstart={() => transitionsRunning += 1}
  on:introend={() => transitionsRunning -= 1}
  on:outrostart={() => { leaving = true; transitionsRunning += 1; }}
  on:outroend={() => { leaving = false; transitionsRunning -= 1; }}
  on:keydown={handleRootKeydown}
  role="none"
>
<div class="chat-width-sizer" bind:this={chatWidthSizer} aria-hidden="true">
  <span class="chat-width-orb"></span>
  <span class="chat-label">{translate("chat")}</span>
  <span class="chat-width-trailing"></span>
</div>
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
      bind:isVisible
      bind:relativeY
      bind:absoluteY
      {onEvent} />

    {#if chatOpen && showChat}
      <div
        class="chat-unfold"
        class:animating={transitionsRunning > 0}
        style="background: {displayBackground}; border-radius: 0 0 {tokens.radius.bar} {tokens.radius.bar}"
        transition:slide|local={{ duration: chatOpen ? unfoldMs : collapseMs, easing: cubicOut }}
        on:introstart={() => transitionsRunning += 1}
        on:introend={() => transitionsRunning -= 1}
        on:outrostart={() => transitionsRunning += 1}
        on:outroend={() => transitionsRunning -= 1}
      >
        <ChatPanel
          {tokens}
          {agentClient}
          {agentPlaceholder}
          {agentVoice}
          {agentQuestionsLimit}
          {agentVoiceSecondsLimit}
          {agentQuestionsRemaining}
          {agentVoiceSecondsRemaining}
          {onAgentQuestion}
          {shortcuts}
          ctaText={agentCta}
          ctaUrl={agentCtaHref} />
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
      {agentQuestionsLimit}
      {agentVoiceSecondsLimit}
      {agentQuestionsRemaining}
      {agentVoiceSecondsRemaining}
      {onAgentQuestion}
      {shortcuts}
      ctaText={agentCta}
      ctaUrl={agentCtaHref}
      showSlashButton={false} />
  {:else}
  <div class="bar" class:compact={foldSkips}>
    <Visibility {onEvent} enabled={!isWidget} bind:isVisible bind:relativeY bind:absoluteY>
      <DefaultPlayPauseButton label={isTitleOnly ? tierCtaText : playPauseLabel} onToggle={handlePlayPause} playing={isPlaying} {tokens} />
    </Visibility>

    <DefaultPlaybackMetadata
      {accessCtaUrl}
      {advertHref}
      {advertText}
      {buffering}
      {currentTime}
      {duration}
      {hasVariants}
      {isAdvert}
      {isStopped}
      {offline}
      {onEvent}
      {openMenu}
      openVersionMenu={openMenuAt("version")}
      {playingTitle}
      {progress}
      {showTierCta}
      {stoppedTitle}
      {tierCtaText}
      {timeLabel}
      {tokens}
      {versionLabel} />

    {#if showPersistentChip}
      <a class="persistent-chip" href={persistentHref} target="_blank" rel="noopener noreferrer" style="--hover-bg: {tokens.hover}; color: {tokens.link}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}">
        {persistentText}
        <span class="ad-badge" style="color: {tokens.muted}; border-color: {tokens.underline}">{translate("advertisementAbbreviation")}</span>
      </a>
    {/if}

    {#if !isStopped && !foldSkips && !isAdvert}
      <SkipButton direction="prev" style={skipStyle} color={tokens.icon} hoverBackground={tokens.hover} pressedBackground={tokens.pressed} focusColor={tokens.text} radius={tokens.radius.control} {onEvent} />
      <SkipButton direction="next" style={skipStyle} color={tokens.icon} hoverBackground={tokens.hover} pressedBackground={tokens.pressed} focusColor={tokens.text} radius={tokens.radius.control} {onEvent} />
    {/if}

    {#if !isStopped && !foldSpeed && !isAdvert}
      <SpeedButton rates={playbackRates} rate={playbackRate} color={tokens.text} hoverBackground={tokens.hover} pressedBackground={tokens.pressed} focusColor={tokens.text} radius={tokens.radius.control} {onEvent} />
    {/if}

    <DefaultUtilityControls
      {infoOpen}
      onClose={handleCloseWidget}
      onDownload={handleDownload}
      onToggleInfo={toggleInfo}
      onToggleOverflow={openMenuAt("overflow")}
      onToggleQueue={toggleQueue}
      overflowOpen={openMenu === "overflow"}
      {queueOpen}
      showClose={false}
      showDownload={hasDownload && !foldDownload}
      showInfo={hasInfo && !foldInfo}
      {showOverflow}
      showQueue={showQueueToggle}
      showTierLock={showTierCta}
      {tokens} />

    {#if showChat}
      <div class="chat-divider" style="background: {tokens.divider}"></div>

      <button
        type="button"
        class="chat-button"
        class:orb-only={!chatLabelVisible}
        style="--bg: {chatOpen ? tokens.pressed : "transparent"}; --hover-bg: {chatOpen ? tokens.pressed : tokens.hover}; --pressed-bg: {tokens.pressed}; border-radius: {tokens.radius.control}; outline-color: {tokens.text}"
        aria-label={(chatDisabled && agentCta) || translate(isPlaylist ? "chatAboutThisPlaylist" : "chatAboutThisArticle")}
        aria-expanded={chatOpen}
        on:click={toggleChat}
        on:mouseup={blurElement}
      >
        <Orb size={22} orb={tokens.orb} ring={tokens.orbRing} avatarUrl={tokens.avatarUrl} dimmed={chatDisabled} generating={callLive && !chatOpen} />
        {#if chatLabelVisible}
          <span class="chat-label" style="color: {chatDisabled ? tokens.muted : tokens.text}">{translate("chat")}</span>
          {#if chatDisabled}
            <LockSimple size={13} color={tokens.muted} />
          {:else}
            <span class="chat-caret" class:flipped={chatOpen}>
              <CaretDown size={14} color={tokens.text} />
            </span>
          {/if}
        {/if}
      </button>
    {/if}

    <DefaultUtilityControls
      {infoOpen}
      onClose={handleCloseWidget}
      onDownload={handleDownload}
      onToggleInfo={toggleInfo}
      onToggleOverflow={openMenuAt("overflow")}
      onToggleQueue={toggleQueue}
      overflowOpen={false}
      {queueOpen}
      showClose={isWidget && showClose}
      showDownload={false}
      showInfo={false}
      showOverflow={false}
      showQueue={false}
      showTierLock={false}
      {tokens} />
  </div>

  {#if infoOpen && hasInfo}
    <div class="chat-unfold" class:animating={transitionsRunning > 0} transition:slide|local={{ duration: infoOpen ? unfoldMs : collapseMs, easing: cubicOut }} on:introstart={() => transitionsRunning += 1} on:introend={() => transitionsRunning -= 1} on:outrostart={() => transitionsRunning += 1} on:outroend={() => transitionsRunning -= 1}>
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
    <div class="chat-unfold" class:animating={transitionsRunning > 0} transition:slide|local={{ duration: chatOpen ? unfoldMs : collapseMs, easing: cubicOut }} on:introstart={() => transitionsRunning += 1} on:introend={() => transitionsRunning -= 1} on:outrostart={() => transitionsRunning += 1} on:outroend={() => transitionsRunning -= 1}>
      <div class="hairline" style="background: {tokens.divider}"></div>
      <ChatPanel
        {tokens}
        {agentClient}
        {agentPlaceholder}
        {agentVoice}
        {agentQuestionsLimit}
        {agentVoiceSecondsLimit}
        {agentQuestionsRemaining}
        {agentVoiceSecondsRemaining}
        {onAgentQuestion}
        ctaText={agentCta}
        ctaUrl={agentCtaHref}
        {shortcuts} />
    </div>
  {/if}

  {#if openMenu}
    <Menu groups={menuGroups} left={menuLeft} anchorTop={menuAnchorTop} anchorBottom={menuAnchorBottom} {tokens} trigger={menuTrigger} onSelect={handleMenuSelect} onClose={() => openMenu = null} />
  {/if}
  {/if}

</div>

{#if !isWidget && showCaption && !agentOnly}
  <DefaultCaption
    {attributionHref}
    backgroundColor={selectedTheme === "dark" ? displayBackground : "transparent"}
    color={captionColor}
    linkColor={tokens.link}
    {disclosureLink}
    {disclosureText}
    hoverColor={tokens.text}
    {logoIconEnabled} />
{/if}
</div>

<style>
  .default-player {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: none;
  }

  .default-player :global(*) {
    font-family: "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  /* Kept out of layout and accessibility while retaining the exact typography
     and chrome of the expanded Chat control for the folding calculation. */
  .chat-width-sizer {
    position: fixed;
    left: -10000px;
    top: -10000px;
    display: flex;
    align-items: center;
    gap: 8px;
    width: max-content;
    padding: 8px 10px;
    visibility: hidden;
    pointer-events: none;
  }

  .chat-width-orb {
    width: 22px;
    height: 22px;
    flex: 0 0 22px;
  }

  .chat-width-trailing {
    width: 14px;
    height: 14px;
    flex: 0 0 14px;
  }

  /* A widget that has been closed fades for 150ms, and Svelte keeps it in the
     DOM until that finishes. It is fixed at the bottom of the window with a
     very high z-index, so while it is invisible it would still take the clicks
     aimed at whatever is now underneath it. */
  .default-player.leaving,
  .default-player.leaving :global(*) {
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

  .surface {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: visible;
  }

  .default-player.fixed {
    position: fixed;
    bottom: 0;
    margin: var(--fixed-margin);
    z-index: 999999;
  }

  .default-player.fixed-left {
    left: 0;
  }

  .default-player.fixed-center {
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }

  .default-player.fixed-right {
    right: 0;
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
    white-space: nowrap;
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
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: none;
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
    .chat-button {
      transition: none;
    }
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

</style>
