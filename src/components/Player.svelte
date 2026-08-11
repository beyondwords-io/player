<!-- svelte-ignore unused-export-let -->
<script>
  import { onDestroy, onMount } from "svelte";
  import MediaElement from "./MediaElement.svelte";
  import UserInterface from "./UserInterface.svelte";
  import DefaultInterface from "./default_player/DefaultInterface.svelte";
  import DefaultSkeleton from "./default_player/Skeleton.svelte";
  import ExternalWidget from "./ExternalWidget.svelte";
  import ControlPanel from "./ControlPanel.svelte";
  import MediaSession from "./MediaSession.svelte";
  import GoogleAnalytics from "./GoogleAnalytics.svelte";
  import SetDaxListenerId from "./SetDaxListenerId.svelte";
  import StyleReset from "./StyleReset.svelte";
  import SegmentContainers from "../helpers/segmentContainers";
  import SegmentClickables from "../helpers/segmentClickables";
  import SegmentHighlights from "../helpers/segmentHighlights";
  import identifiersEvent from "../helpers/identifiersEvent";
  import newEvent from "../helpers/newEvent";
  import MockAgentClient from "../helpers/agentClient";
  import RealAgentClient from "../helpers/realAgentClient";
  import sectionEnabled from "../helpers/sectionEnabled";
  import { findByQuery }  from "../helpers/resolveTarget";
  import { knownPlayerStyle } from "../helpers/playerStyles";
  import { isDigitalAdExchange} from "../helpers/vastUrlParams";
  import { setLocale } from "../helpers/translate";
  import parseMargin from "../helpers/parseMargin";
  import deriveTokens from "../helpers/default_theme/deriveTokens";
  import explicitOverrides from "../helpers/default_theme/explicitOverrides";
  import { normalizeAgentLimit, remainingAgentLimit } from "../helpers/agentLimits";

  // Please document all settings and keep in-sync with the developer docs:
  // https://github.com/beyondwords-core/docs/blob/main/docs-and-guides/distribution/player/sdk/javascript/player-settings.mdx
  export let playerApiUrl = "https://api.beyondwords.io/v1/projects/{id}/player";
  export let projectId = undefined;
  export let contentId = undefined;
  export let playlistId = undefined;
  export let sourceId = undefined;
  export let sourceUrl = undefined;
  export let playlist = [];
  export let summary = false;
  export let clientSideEnabled = false;
  export let continuousPlaybackMode = "auto";
  export let showUserInterface = true;
  export let showBottomWidget = false;
  export let showCloseWidget = true;
  export let playerStyle = "standard";
  export let videoSizes = [];
  export let playerTitle = undefined;
  export let titleEnabled = true;
  export let callToAction = undefined;
  export let playerLanguage = undefined;
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playlistToggle = "auto";
  export let downloadFormats = [];
  export let durationFormat = undefined;
  export let mediaSession = "auto";
  export let content = [];
  export let contentIndex = 0;
  export let introsOutros = [];
  export let introsOutrosIndex = -1;
  export let adverts = [];
  export let advertIndex = -1;
  export let preloadAdvertIndex = -1;
  export let minDurationForMidroll = 2 * 60;
  export let minTimeUntilEndForMidroll = 10;
  export let outroPlaybackMode = "after-all";
  export let persistentAdImage = false;
  export let persistentIndex = -1;
  export let duration = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let playbackRate = 1;
  export let playbackRates = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 2, 2.5, 3];
  export let widgetStyle = "standard";
  export let widgetPosition = "auto";
  export let widgetWidth = "auto";
  export let widgetMargin = "16px";
  export let widgetTarget = undefined;
  export let textColor = "#111";
  export let backgroundColor = "#f5f5f5";
  export let iconColor = "rgba(0, 0, 0, 0.8)";
  export let highlightColor = "#eee";
  export let videoTextColor = "white";
  export let videoBackgroundColor = "black"; // TODO: how to implement with easing gradient?
  export let videoIconColor = "white";
  export let logoIconEnabled = true;
  export let highlightSections = "all";
  export let clickableSections = "all";
  export let segmentWidgetSections = "body";
  export let segmentWidgetPosition = "7-oclock";
  export let currentSegment = undefined;
  export let hoveredSegment = undefined;
  export let loadedMedia = undefined;
  export let previewToken = undefined;
  export let wordHighlightsEnabled = false;
  export let wordHighlightColor = undefined;
  export let advertConsent = "personalized";
  export let analyticsConsent = "allowed";
  export let analyticsCustomUrl = undefined;
  export let analyticsDeviceType = "auto";
  export let analyticsTag = undefined;
  export let mediaCustomUrl = undefined;
  export let segmentLimit = undefined;
  export let captureErrors = true;
  export let onError = () => {};
  export let transitions = [];
  export let controlPanel = undefined;

  // Settings for the "default" player style. The /player API supplies the
  // project baseline; script-tag and preview values remain overrides.
  export let video = false;
  export let embedMode = "audio";
  export let widgetEmbedMode = "auto";
  export let accessCtaText = undefined;
  export let accessCtaUrl = undefined;

  // The agent can be sold separately, so it has its own pair. Unset, they
  // inherit the ones above.
  export let agentCtaText = undefined;
  export let agentCtaUrl = undefined;

  // A public ElevenLabs agent id connects the live agent in place of the
  // scripted mock. Served as conversational_agent.elevenlabs_agent_id by
  // /player; a token endpoint replaces it when agent auth lands.
  export let agentId = undefined;
  export let theme = "light";
  export let radius = 8;
  export let agentColor = undefined;
  export let agentAvatar = undefined;
  export let accentColor = undefined;
  export let accentTextColor = undefined;
  export let agentQuestionsLimit = null;
  export let agentVoiceSecondsLimit = null;
  export let agentVoice = true;
  export let agentPlaceholder = undefined;
  export let agentName = undefined;
  export let agentSessionConfig = {};
  export let shortcuts = [];
  export let infoText = undefined;
  export let disclosureText = undefined;
  export let disclosureLink = undefined;
  export let variants = [];
  export const addEventListener = (...args) => controller.addEventListener(...args);
  export const removeEventListener = (...args) => controller.removeEventListener(...args);

  // These are set automatically.
  export let initialProps = {};
  export let videoPlayerStyleAlias = undefined;

  // The last /player response, the URL it came from, and every value it tried
  // to set (including ones an override rejected). For tooling only: ignored
  // props, so they never reach events or analytics.
  export let apiPayload = undefined;
  export let apiRequestUrl = undefined;
  export let apiProps = undefined;

  export let showMediaSession = false;
  export let segmentLimitReached = false;
  export let metadataLoaded = false;
  export let isFullScreen = false;
  export let mediaElement = undefined;
  export let userInterface = undefined;
  export let widgetInterface = undefined;
  export let controller = undefined;
  export let logoImagePosition = undefined;
  export let analyticsUrl = undefined;
  export let analyticsId = undefined;
  export let platform = "web";
  export let vendorIdentifier = undefined;
  export let bundleIdentifier = undefined;
  export let contentLanguage = "en";
  export let listenSessionId = undefined;
  export let sessionCreatedAt = undefined;
  export let companionAdvert = undefined;
  export let isNewListen = false;
  export let prevPercentage = 0;
  export let segmentWidgets = [];
  export let segmentContainers = new SegmentContainers(arr => segmentWidgets = arr);
  export let segmentClickables = new SegmentClickables();
  export let segmentHighlights = new SegmentHighlights();
  export const onEvent = e => controller.processEvent({ emittedFrom, ...e });

  // The inline player and its widget are two views of one conversation. Keep
  // the client above both interfaces so scrolling between them cannot fork the
  // thread or leave a hidden voice session running.
  //
  // An agent id (from /player or the script tag) selects the live client; it
  // can arrive after mount, so swapping ends whatever the old client had open.
  let agentClient = new MockAgentClient();
  let pausedForAgentCall = false;

  $: syncAgentClient(agentId, agentSessionConfig);

  const syncAgentClient = (id, sessionConfig) => {
    const wantedId = typeof id === "string" && id.trim().length > 0 ? id.trim() : null;
    const currentId = agentClient instanceof RealAgentClient ? agentClient.agentId : null;
    const wantedConfigKey = JSON.stringify(sessionConfig || {});
    const currentConfigKey = agentClient instanceof RealAgentClient ? agentClient.sessionConfigKey : "{}";
    if (wantedId === currentId && wantedConfigKey === currentConfigKey) { return; }

    agentClient.endSession();
    agentClient = wantedId
      ? new RealAgentClient({ agentId: wantedId, sessionConfig, dynamicVariables: agentDynamicVariables })
      : new MockAgentClient();
  };

  // Per-page context for the agent's prompt, read at session start so the
  // loaded content is in by then. Keys match the /player payload's naming.
  const agentDynamicVariables = () => ({
    project_id: projectId,
    content_id: contentItem?.id,
    source_id: contentItem?.sourceId,
    title: contentItem?.title,
  });

  $: agentCallLive = $agentClient.kind === "voice";
  $: agentVoiceSessionLive = agentCallLive && $agentClient.status !== "connecting";
  $: syncAgentCallPlayback(agentCallLive, playbackState);

  let agentQuestionsUsed = 0;
  let agentVoiceSecondsUsed = 0;
  let agentAllowanceIdentity;
  let agentVoiceAllowanceTimer;

  $: normalizedAgentQuestionsLimit = normalizeAgentLimit(agentQuestionsLimit);
  $: normalizedAgentVoiceSecondsLimit = normalizeAgentLimit(agentVoiceSecondsLimit);
  $: agentQuestionsRemaining = remainingAgentLimit(normalizedAgentQuestionsLimit, agentQuestionsUsed);
  $: agentVoiceSecondsRemaining = remainingAgentLimit(normalizedAgentVoiceSecondsLimit, agentVoiceSecondsUsed);
  $: resetAgentAllowance(JSON.stringify([
    projectId, contentId, playlistId, sourceId, sourceUrl, accessTier, apiPayload?.access_tier?.slug,
    normalizedAgentQuestionsLimit, normalizedAgentVoiceSecondsLimit,
  ]));
  $: syncAgentVoiceAllowance(agentVoiceSessionLive, agentVoiceSecondsRemaining);

  const resetAgentAllowance = (identity) => {
    if (identity === agentAllowanceIdentity) { return; }

    agentAllowanceIdentity = identity;
    agentQuestionsUsed = 0;
    agentVoiceSecondsUsed = 0;
  };

  const useAgentQuestion = () => {
    if (agentQuestionsRemaining === null || agentQuestionsRemaining === 0) { return; }
    agentQuestionsUsed += 1;
  };

  const syncAgentVoiceAllowance = (live, secondsRemaining) => {
    const shouldMeter = live && secondsRemaining !== null && secondsRemaining > 0;

    if (shouldMeter && !agentVoiceAllowanceTimer) {
      agentVoiceAllowanceTimer = setInterval(() => {
        agentVoiceSecondsUsed += 1;
        if (remainingAgentLimit(normalizedAgentVoiceSecondsLimit, agentVoiceSecondsUsed) === 0) {
          agentClient.endSession("budget");
        }
      }, 1000);
    }

    if (!shouldMeter && agentVoiceAllowanceTimer) {
      clearInterval(agentVoiceAllowanceTimer);
      agentVoiceAllowanceTimer = undefined;
    }
  };

  const syncAgentCallPlayback = (live, state) => {
    // The transport stays visible beside Chat. If it is pressed during a call,
    // immediately restore the call's pause instead of letting both audio
    // streams play together.
    if (live && state === "playing") {
      pausedForAgentCall = true;

      onEvent(newEvent({
        type: "PressedPause",
        description: "The pause button was pressed.",
        initiatedBy: "user",
      }));
    }

    if (!live && pausedForAgentCall) {
      pausedForAgentCall = false;

      onEvent(newEvent({
        type: "PressedPlay",
        description: "The play button was pressed.",
        initiatedBy: "user",
      }));
    }
  };

  let accessTierRevision = 0;
  export let accessTier = undefined;
  export const getAccessTier = () => accessTier;
  export const setAccessTier = (value, emitIdentifiersEvent = true) => {
    accessTier = value; 
    if (emitIdentifiersEvent) accessTierRevision++;
  };

  // Mirrors the default widget's mobile dock, so the sliding video follows it.
  let dockedViewport = false;
  onMount(() => {
    const query = matchMedia("(max-width: 640px)");
    const update = () => dockedViewport = query.matches;
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  });

  // Hides the default-style boot skeleton once the API reports no content.
  let noContentAvailable = false;
  onMount(() => addEventListener("NoContentAvailable", () => noContentAvailable = true));
  $: projectId, contentId, playlistId, sourceId, sourceUrl, noContentAvailable = false;

  // A tier's limit stops playback and rewinds to zero, so by the time anything
  // renders the time no longer says the preview ran out. Remember the event.
  onMount(() => addEventListener("SegmentLimitReached", () => segmentLimitReached = true));
  $: projectId, contentId, playlistId, sourceId, sourceUrl, contentIndex, summary, segmentLimitReached = false;

  // Offering one variant is a statement about what this embed plays, not just
  // about what the Version menu shows, so select it. Declared before the
  // identifiers statement below so the first request already asks for it.
  $: if (variants.length === 1) { summary = variants[0] === "summary"; }

  $: setLocale(playerLanguage);

  $: contentItem = content[contentIndex];
  $: activeIntroOrOutro = introsOutros[introsOutrosIndex];
  $: activeAdvert = adverts[advertIndex];
  $: preloadAdvert = adverts[preloadAdvertIndex];
  $: persistentAdvert = adverts[persistentIndex];

  $: isAdvert = activeAdvert && playbackState !== "stopped";
  $: isAudio = loadedMedia?.format === "audio";
  $: isVideo = loadedMedia?.format === "video";

  $: hasDaxAdverts = adverts.some(ad => isDigitalAdExchange(ad.vastUrl));
  $: setDaxListenerId = hasDaxAdverts && advertConsent === "personalized";

  $: interfaceStyle = isFullScreen && playerStyle !== "default" ? "video" : playerStyle;
  $: showWidget = showBottomWidget || widgetTarget;

  $: isScreen = interfaceStyle === "screen";
  $: isLarge = interfaceStyle === "large";

  $: maxImageSize = isScreen ? 120 : isLarge ? 80 : 0;

  $: showStaticInterface = showUserInterface && knownPlayerStyle(interfaceStyle) && content.length > 0;
  // The widget is the same bar recomposed, so the default style always carries
  // into it. "none" and the closed-by-user sentinel still switch it off.
  $: widgetIsOff = widgetStyle === "none" || widgetStyle === "closed-by-user";
  $: inheritedWidgetStyle = !widgetStyle || widgetStyle === "auto" ? playerStyle : widgetStyle;
  $: effectiveWidgetStyle = widgetIsOff ? widgetStyle
    : playerStyle === "default" ? "default"
    : inheritedWidgetStyle;

  // The widget's agent surfaces can be configured separately; auto inherits.
  $: effectiveWidgetEmbedMode = !widgetEmbedMode || widgetEmbedMode === "auto" ? embedMode : widgetEmbedMode;

  $: showWidgetInterface = showUserInterface && showWidget && knownPlayerStyle(effectiveWidgetStyle) && content.length > 0;

  $: widgetTarget = findByQuery(widgetTarget, "widget");
  $: controlPanel = findByQuery(controlPanel, "control panel");

  $: widgetShowsVideo = effectiveWidgetStyle === "video"
    || (effectiveWidgetStyle === "default" && video === true && hasVideoContent);
  $: videoBehindWidget = showWidget && widgetShowsVideo && !isFullScreen;
  $: videoBehindStatic = (interfaceStyle === "video" || (interfaceStyle === "default" && isVideo)) && !videoBehindWidget;

  // The sliding video and the default widget bar must land on the same rect,
  // so the geometry the default style implies is resolved once, here, and both
  // components are told the same thing. Legacy styles pass through unchanged.
  $: widgetIsDefault = effectiveWidgetStyle === "default";
  $: widgetSideMargins = parseMargin(widgetMargin || "16px");
  $: resolvedWidgetPosition = widgetIsDefault && widgetPosition === "auto" ? "center" : widgetPosition;
  $: resolvedWidgetWidth = widgetIsDefault && (widgetWidth === "auto" || widgetWidth === 0 || widgetWidth === "0")
    ? (dockedViewport ? "100vw" : `min(440px, calc(100vw - ${widgetSideMargins.left} - ${widgetSideMargins.right}))`)
    : widgetWidth;
  $: resolvedWidgetMargin = widgetIsDefault && dockedViewport ? "0" : widgetMargin;

  $: showClose = showCloseWidget && effectiveWidgetStyle !== "small" && !isAdvert;
  $: emittedFrom = videoBehindWidget ? "bottom-widget" : "inline-player";

  $: currentVideoContent = summary ? contentItem?.summarization?.video : contentItem?.video;
  $: hasVideoContent = (currentVideoContent || []).length > 0;
  $: videoMightBeShown = playerStyle === "video" || effectiveWidgetStyle === "video" || ((playerStyle === "default" || effectiveWidgetStyle === "default") && video === true);
  $: videoRoot = videoBehindWidget ? widgetTarget : null; // null will be shown inline (static)
  $: aspectRatio = isVideo && loadedMedia.videoSize ? (loadedMedia.videoSize.width / loadedMedia.videoSize.height) : (16 / 9);

  $: showVideoPoster = isAudio && videoMightBeShown && metadataLoaded;
  $: videoPosterImage = showVideoPoster ? (isAdvert && activeAdvert?.imageUrl || contentItem?.imageUrl) : "";

  $: projectId, contentId, playlistId, sourceId, sourceUrl, playlist, previewToken, accessTierRevision, onEvent(identifiersEvent());

  $: lastHovered = hoveredSegment || lastHovered;
  $: currentSegment, currentAllowedInWidget && resetHovered();

  const resetHovered = () => lastHovered = hoveredSegment;

  $: currentAllowedInWidget = sectionEnabled("current", currentSegment, segmentWidgetSections);
  $: hoveredAllowedInWidget = sectionEnabled("hovered", lastHovered, segmentWidgetSections);

  $: widgetSegment = (hoveredAllowedInWidget && lastHovered) || (currentAllowedInWidget && currentSegment);

  $: widgetIsCurrent = widgetSegment?.marker === currentSegment?.marker;
  $: showRealTimeInWidget = widgetIsCurrent || activeAdvert || activeIntroOrOutro;

  $: segmentContainers.update(widgetSegment, segmentWidgetSections, segmentWidgetPosition, playerStyle);
  $: segmentClickables.update(hoveredSegment, clickableSections);

  // In-article highlighting is part of the default style's colour contract, so
  // an unconfigured project gets the theme's lime rather than the legacy props.
  $: defaultTokens = playerStyle === "default"
    ? deriveTokens({ theme, overrides: explicitOverrides({ highlightColor, wordHighlightColor }) })
    : undefined;

  $: activeHighlightColor = defaultTokens?.highlight || highlightColor;
  $: activeWordHighlightColor = defaultTokens?.wordHighlight || wordHighlightColor;

  $: wordHighlightsActive = wordHighlightsEnabled && !!activeWordHighlightColor;
  $: currentActiveMarker = isAdvert || activeIntroOrOutro ? null : currentSegment?.marker;
  $: segmentHighlights.update("current", currentSegment, { sections: [highlightSections], background: activeHighlightColor, wordHighlightColor: activeWordHighlightColor, currentTime, activeMarker: currentActiveMarker, wordHighlightsEnabled: wordHighlightsActive });
  $: segmentHighlights.update("hovered", hoveredSegment, { sections: [highlightSections, clickableSections], background: activeHighlightColor, wordHighlightColor: activeWordHighlightColor, currentTime, activeMarker: currentActiveMarker, wordHighlightsEnabled: wordHighlightsActive });

  onDestroy(() => {
    clearInterval(agentVoiceAllowanceTimer);
    agentClient.endSession();
    segmentContainers.reset();
    segmentClickables.reset();
    segmentHighlights.reset("current");
    segmentHighlights.reset("hovered");
  });
</script>

<ExternalWidget prepend root={videoRoot}>
{#key playerLanguage}
    <MediaElement
    bind:this={mediaElement}
    {onEvent}
    {videoSizes}
    {content}
    {contentIndex}
    {segmentLimit}
    {summary}
    {activeIntroOrOutro}
    {preloadAdvert}
    {activeAdvert}
    {advertConsent}
    {maxImageSize}
    {projectId}
    {playlistId}
    contentId={contentItem?.id}
    {contentLanguage}
    {platform}
    {vendorIdentifier}
    {bundleIdentifier}
    bind:playbackState
    bind:duration
    bind:currentTime
    bind:playbackRate
    bind:prevPercentage
    bind:metadataLoaded
    {showUserInterface}
    {videoBehindWidget}
    {videoBehindStatic}
    {videoMightBeShown}
    {aspectRatio}
    {isFullScreen}
    widgetPosition={resolvedWidgetPosition}
    widgetWidth={resolvedWidgetWidth}
    widgetMargin={resolvedWidgetMargin}
    {widgetTarget} />
{/key}
</ExternalWidget>

{#if showStaticInterface && interfaceStyle === "default"}
  {#key playerLanguage}
  <DefaultInterface
    bind:this={userInterface}
    {onEvent}
    {agentClient}
    {embedMode}
    {analyticsId}
    {theme}
    {radius}
    {content}
    {contentIndex}
    bind:summary
    {duration}
    {currentTime}
    {playbackState}
    {playbackRate}
    {playbackRates}
    {skipButtonStyle}
    {playlistStyle}
    {playlistToggle}
    {downloadFormats}
    {playerTitle}
    {titleEnabled}
    {callToAction}
    {contentLanguage}
    {variants}
    {textColor}
    {backgroundColor}
    {iconColor}
    {highlightColor}
    {wordHighlightColor}
    {videoTextColor}
    {videoIconColor}
    {agentColor}
    {agentAvatar}
    {accentColor}
    {accentTextColor}
    agentQuestionsLimit={normalizedAgentQuestionsLimit}
    agentVoiceSecondsLimit={normalizedAgentVoiceSecondsLimit}
    {agentQuestionsRemaining}
    {agentVoiceSecondsRemaining}
    onAgentQuestion={useAgentQuestion}
    {agentVoice}
    {agentPlaceholder}
    {agentName}
    {shortcuts}
    {infoText}
    {disclosureText}
    {disclosureLink}
    {logoIconEnabled}
    videoIsBehind={videoBehindStatic}
    {aspectRatio}
    {activeAdvert}
    {persistentAdvert}
    {metadataLoaded}
    {segmentLimit}
    {segmentLimitReached}
    {accessCtaText}
    {accessCtaUrl}
    {agentCtaText}
    {agentCtaUrl} />
  {/key}
{:else if showStaticInterface}
  {#key playerLanguage}
  <UserInterface
    bind:this={userInterface}
    {onEvent}
    playerStyle={interfaceStyle}
    {callToAction}
    {skipButtonStyle}
    {playlistStyle}
    {playlistToggle}
    {downloadFormats}
    {durationFormat}
    {playerTitle}
    {content}
    {contentIndex}
    {summary}
    {duration}
    {currentTime}
    {playbackState}
    {playbackRate}
    {playbackRates}
    {activeAdvert}
    {activeIntroOrOutro}
    {persistentAdvert}
    {companionAdvert}
    {analyticsId}
    {textColor}
    {backgroundColor}
    {iconColor}
    {videoTextColor}
    {videoBackgroundColor}
    {videoIconColor}
    {logoIconEnabled}
    {logoImagePosition}
    {maxImageSize}
    {isFullScreen}
    {aspectRatio}
    {videoPosterImage}
    videoIsBehind={videoBehindStatic} />
  {/key}
{:else if showUserInterface && interfaceStyle === "default" && content.length === 0 && projectId !== undefined && !noContentAvailable}
  <DefaultSkeleton showChatBlock={embedMode !== "audio"} {theme} {radius} {backgroundColor} {textColor} />
{/if}

{#if showWidgetInterface && effectiveWidgetStyle === "default"}
  <ExternalWidget root={widgetTarget}>
    {#key playerLanguage}
    <DefaultInterface
      bind:this={widgetInterface}
      {onEvent}
      {agentClient}
      embedMode={effectiveWidgetEmbedMode}
      {analyticsId}
      {theme}
      {radius}
      isWidget={true}
      videoIsBehind={videoBehindWidget}
      {aspectRatio}
      fixedPosition={!widgetTarget && widgetPosition}
      fixedWidth={widgetWidth}
      fixedMargin={widgetMargin}
      {showClose}
      {content}
      {contentIndex}
      bind:summary
      {duration}
      {currentTime}
      {playbackState}
      {playbackRate}
      {playbackRates}
      {skipButtonStyle}
      {downloadFormats}
      {playerTitle}
    {titleEnabled}
      {callToAction}
      {contentLanguage}
      {variants}
      {textColor}
      {backgroundColor}
      {iconColor}
      {highlightColor}
      {wordHighlightColor}
      {videoTextColor}
      {videoIconColor}
      {agentColor}
      {agentAvatar}
      {accentColor}
      {accentTextColor}
      agentQuestionsLimit={normalizedAgentQuestionsLimit}
      agentVoiceSecondsLimit={normalizedAgentVoiceSecondsLimit}
      {agentQuestionsRemaining}
      {agentVoiceSecondsRemaining}
      onAgentQuestion={useAgentQuestion}
      {agentVoice}
      {agentPlaceholder}
      {agentName}
      {shortcuts}
      {infoText}
      {disclosureText}
      {disclosureLink}
      {logoIconEnabled}
      {activeAdvert}
      {persistentAdvert}
      {metadataLoaded}
      {segmentLimit}
      {segmentLimitReached}
      {accessCtaText}
      {accessCtaUrl}
      {agentCtaText}
      {agentCtaUrl} />
    {/key}
  </ExternalWidget>
{:else if showWidgetInterface}
  <ExternalWidget root={widgetTarget}>
    {#key playerLanguage}
    <UserInterface
      bind:this={widgetInterface}
      {onEvent}
      playerStyle={effectiveWidgetStyle}
      {callToAction}
      {skipButtonStyle}
      playlistStyle="hide"
      playlistToggle="hide"
      {downloadFormats}
      {durationFormat}
      {playerTitle}
      fixedPosition={!widgetTarget && widgetPosition}
      fixedWidth={widgetWidth}
      fixedMargin={widgetMargin}
      {showClose}
      {content}
      {contentIndex}
      {summary}
      {duration}
      {currentTime}
      {playbackState}
      {playbackRate}
      {playbackRates}
      {activeAdvert}
      {activeIntroOrOutro}
      {persistentAdvert}
      {companionAdvert}
      {analyticsId}
      {textColor}
      {backgroundColor}
      {iconColor}
      {videoTextColor}
      {videoBackgroundColor}
      {videoIconColor}
      {logoIconEnabled}
      {logoImagePosition}
      {maxImageSize}
      {aspectRatio}
      {videoPosterImage}
      videoIsBehind={videoBehindWidget} />
    {/key}
  </ExternalWidget>
{/if}

{#each segmentWidgets as root (root)}
  <ExternalWidget {root}>
    {#key playerLanguage}
    <UserInterface
      onEvent={e => onEvent({...e, emittedFrom: "segment-widget", widgetSegment, widgetIsCurrent })}
      playerStyle="small"
      fixedWidth={0}
      logoIconEnabled={false}
      {content}
      {contentIndex}
      {summary}
      {duration}
      currentTime={showRealTimeInWidget ? currentTime : widgetSegment.startTime}
      playbackState={showRealTimeInWidget ? playbackState : "paused"}
      {activeAdvert}
      {activeIntroOrOutro}
      {persistentAdvert}
      {companionAdvert}
      {analyticsId}
      {textColor}
      {backgroundColor}
      {iconColor}
      {videoTextColor}
      {videoBackgroundColor}
      {videoIconColor} />
    {/key}
  </ExternalWidget>
{/each}

{#if controlPanel}
  <ExternalWidget root={controlPanel}>
    <!-- Reads the player's own props and writes them back as overrides, so it
         needs the controller rather than a binding per setting. -->
    <ControlPanel bind:controlPanel {controller} />
  </ExternalWidget>
{/if}

{#if showMediaSession}
  <MediaSession
    {onEvent}
    {content}
    {contentIndex}
    {activeAdvert}
    {persistentAdvert}
    {companionAdvert}
    {duration}
    {playbackState}
    {skipButtonStyle}
    {backgroundColor}
    {iconColor}
  />
{/if}

{#if analyticsTag}
  <GoogleAnalytics {analyticsTag} />
{/if}

{#if setDaxListenerId}
  <SetDaxListenerId />
{/if}

<StyleReset />
