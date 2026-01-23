<!-- svelte-ignore unused-export-let -->
<script>
  import { onMount, onDestroy } from "svelte";
  import MediaElement from "./MediaElement.svelte";
  import UserInterface from "./UserInterface.svelte";
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
  import sectionEnabled from "../helpers/sectionEnabled";
  import { findByQuery }  from "../helpers/resolveTarget";
  import { knownPlayerStyle } from "../helpers/playerStyles";
  import { isDigitalAdExchange} from "../helpers/vastUrlParams";

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
  export let showUserInterface = true;
  export let showBottomWidget = false;
  export let showCloseWidget = true;
  export let playerStyle = "standard";
  export let videoSizes = [];
  export let playerTitle = undefined;
  export let callToAction = undefined;
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
  export let advertConsent = "personalized";
  export let analyticsConsent = "allowed";
  export let analyticsCustomUrl = undefined;
  export let analyticsDeviceType = "auto";
  export let analyticsTag = undefined;
  export let captureErrors = true;
  export let onError = () => {};
  export let transitions = [];
  export let controlPanel = undefined;
  export const addEventListener = (...args) => controller.addEventListener(...args);
  export const removeEventListener = (...args) => controller.removeEventListener(...args);

  // These are set automatically.
  export let initialProps = {};
  export let showMediaSession = false;
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

  $: contentItem = content[contentIndex];
  $: introOrOutro = introsOutros[introsOutrosIndex];
  $: activeAdvert = adverts[advertIndex];
  $: preloadAdvert = adverts[preloadAdvertIndex];
  $: persistentAdvert = adverts[persistentIndex];

  $: isAdvert = activeAdvert && playbackState !== "stopped";
  $: isAudio = loadedMedia?.format === "audio";
  $: isVideo = loadedMedia?.format === "video";

  $: hasDaxAdverts = adverts.some(ad => isDigitalAdExchange(ad.vastUrl));
  $: setDaxListenerId = hasDaxAdverts && advertConsent === "personalized";

  $: interfaceStyle = isFullScreen ? "video" : playerStyle;
  $: showWidget = showBottomWidget || widgetTarget;

  $: isScreen = interfaceStyle === "screen";
  $: isLarge = interfaceStyle === "large";

  $: maxImageSize = isScreen ? 120 : isLarge ? 80 : 0;

  $: showStaticInterface = showUserInterface && knownPlayerStyle(interfaceStyle) && content.length > 0;
  $: showWidgetInterface = showUserInterface && showWidget && knownPlayerStyle(widgetStyle) && content.length > 0;

  $: widgetTarget = findByQuery(widgetTarget, "widget");
  $: controlPanel = findByQuery(controlPanel, "control panel");

  $: videoBehindWidget = showWidget && widgetStyle === "video" && !isFullScreen;
  $: videoBehindStatic = interfaceStyle === "video" && !videoBehindWidget;

  $: showClose = showCloseWidget && widgetStyle !== "small" && !isAdvert;
  $: emittedFrom = videoBehindWidget ? "bottom-widget" : "inline-player";

  $: videoMightBeShown = playerStyle === "video" || widgetStyle === "video";
  $: videoRoot = videoBehindWidget ? widgetTarget : null; // null will be shown inline (static)
  $: aspectRatio = isVideo ? (loadedMedia.videoSize.width / loadedMedia.videoSize.height) : (16 / 9);

  $: showVideoPoster = isAudio && videoMightBeShown && metadataLoaded;
  $: videoPosterImage = showVideoPoster ? (isAdvert && activeAdvert?.imageUrl || contentItem?.imageUrl) : "";

  $: projectId, contentId, playlistId, sourceId, sourceUrl, playlist, previewToken, onEvent(identifiersEvent());

  $: lastHovered = hoveredSegment || lastHovered;
  $: currentSegment, currentAllowedInWidget && resetHovered();

  const resetHovered = () => lastHovered = hoveredSegment;

  $: currentAllowedInWidget = sectionEnabled("current", currentSegment, segmentWidgetSections);
  $: hoveredAllowedInWidget = sectionEnabled("hovered", lastHovered, segmentWidgetSections);

  $: widgetSegment = (hoveredAllowedInWidget && lastHovered) || (currentAllowedInWidget && currentSegment);

  $: widgetIsCurrent = widgetSegment?.marker === currentSegment?.marker;
  $: showRealTimeInWidget = widgetIsCurrent || activeAdvert || introOrOutro;

  $: segmentContainers.update(widgetSegment, segmentWidgetSections, segmentWidgetPosition, playerStyle);
  $: segmentClickables.update(hoveredSegment, clickableSections);

  $: isPlaying = playbackState === "playing";
  $: segmentHighlights.update("current", currentSegment, [highlightSections], highlightColor, currentTime, isPlaying);
  $: segmentHighlights.update("hovered", hoveredSegment, [highlightSections, clickableSections], highlightColor, currentTime, isPlaying);

  // Handle click-to-seek from word highlights
  const handleSeekEvent = (event) => {
    const { time } = event.detail;
    if (typeof time === "number" && !isNaN(time)) {
      currentTime = time;
      if (playbackState !== "playing") {
        playbackState = "playing";
      }
    }
  };

  // Handle pause from clicking currently playing word
  const handlePauseEvent = () => {
    if (playbackState === "playing") {
      playbackState = "paused";
    }
  };

  onMount(() => {
    document.addEventListener("beyondwords-seek", handleSeekEvent);
    document.addEventListener("beyondwords-pause", handlePauseEvent);
    return () => {
      document.removeEventListener("beyondwords-seek", handleSeekEvent);
      document.removeEventListener("beyondwords-pause", handlePauseEvent);
    };
  });

  onDestroy(() => {
    segmentContainers.reset();
    segmentClickables.reset();
    segmentHighlights.reset("current");
    segmentHighlights.reset("hovered");
    document.removeEventListener("beyondwords-seek", handleSeekEvent);
    document.removeEventListener("beyondwords-pause", handlePauseEvent);
  });
</script>

<ExternalWidget prepend root={videoRoot}>
  <MediaElement
    bind:this={mediaElement}
    {onEvent}
    {videoSizes}
    {content}
    {contentIndex}
    {summary}
    {introOrOutro}
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
    {widgetPosition}
    {widgetWidth}
    {widgetMargin}
    {widgetTarget} />
</ExternalWidget>

{#if showStaticInterface}
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
{/if}

{#if showWidgetInterface}
  <ExternalWidget root={widgetTarget}>
    <UserInterface
      bind:this={widgetInterface}
      {onEvent}
      playerStyle={widgetStyle}
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
  </ExternalWidget>
{/if}

{#each segmentWidgets as root (root)}
  <ExternalWidget {root}>
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
      {persistentAdvert}
      {companionAdvert}
      {analyticsId}
      {textColor}
      {backgroundColor}
      {iconColor}
      {videoTextColor}
      {videoBackgroundColor}
      {videoIconColor} />
  </ExternalWidget>
{/each}

{#if controlPanel}
  <ExternalWidget root={controlPanel}>
    <ControlPanel
      bind:controlPanel
      bind:projectId
      bind:contentId
      bind:playlistId
      bind:sourceId
      bind:sourceUrl
      bind:summary
      bind:showUserInterface
      bind:playerStyle
      bind:playerTitle
      bind:callToAction
      bind:skipButtonStyle
      bind:playlistStyle
      bind:playlistToggle
      bind:mediaSession
      {content}
      bind:contentIndex
      {introsOutros}
      bind:introsOutrosIndex
      {adverts}
      bind:advertIndex
      bind:persistentAdImage
      bind:persistentIndex
      bind:duration
      bind:currentTime
      bind:playbackState
      bind:playbackRate
      bind:widgetStyle
      bind:widgetPosition
      bind:widgetWidth
      bind:widgetMargin
      bind:widgetTarget
      bind:textColor
      bind:backgroundColor
      bind:iconColor
      bind:highlightColor
      bind:videoTextColor
      bind:videoIconColor
      bind:logoIconEnabled
      bind:highlightSections
      bind:clickableSections
      bind:segmentWidgetSections
      bind:segmentWidgetPosition
      bind:currentSegment
      bind:hoveredSegment
      bind:advertConsent
      bind:analyticsConsent
      bind:analyticsCustomUrl
      bind:analyticsTag />
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
