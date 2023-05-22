<!-- svelte-ignore unused-export-let -->
<script>
  import MediaElement from "./MediaElement.svelte";
  import UserInterface from "./UserInterface.svelte";
  import ExternalWidget from "./ExternalWidget.svelte";
  import ControlPanel from "./ControlPanel.svelte";
  import MediaSession from "./MediaSession.svelte";
  import GoogleAnalytics from "./GoogleAnalytics.svelte";
  import StyleReset from "./StyleReset.svelte";
  import SegmentContainers from "../helpers/segmentContainers";
  import SegmentClickables from "../helpers/segmentClickables";
  import SegmentHighlights from "../helpers/segmentHighlights";
  import identifiersEvent from "../helpers/identifiersEvent";
  import onStatusChange from "../helpers/onStatusChange";
  import sectionEnabled from "../helpers/sectionEnabled";
  import applyTransitions from "../helpers/applyTransitions";
  import { findByQuery }  from "../helpers/resolveTarget";

  // Please document all settings and keep in-sync with /doc/player-settings.md
  export let playerApiUrl = "https://api.beyondwords.io/v1/projects/{id}/player";
  export let projectId = undefined;
  export let contentId = undefined;
  export let playlistId = undefined;
  export let sourceId = undefined;
  export let sourceUrl = undefined;
  export let playlist = [];
  export let showUserInterface = true;
  export let playerStyle = "standard";
  export let playerTitle = undefined;
  export let callToAction = undefined;
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playlistToggle = "auto";
  export let downloadFormats = [];
  export let mediaSession = "auto";
  export let content = [];
  export let contentIndex = 0;
  export let introsOutros = [];
  export let introsOutrosIndex = -1;
  export let adverts = [];
  export let advertIndex = -1;
  export let duration = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let playbackRate = 1;
  export let widgetStyle = "standard";
  export let widgetPosition = "auto";
  export let widgetWidth = "auto";
  export let widgetTarget = undefined;
  export let textColor = "#111";
  export let backgroundColor = "#f5f5f5";
  export let iconColor = "rgba(0, 0, 0, 0.8)";
  export let highlightColor = "#eee";
  export let logoIconEnabled = true;
  export let highlightSections = "all";
  export let clickableSections = "all";
  export let segmentWidgetSections = "body";
  export let segmentWidgetPosition = "7-oclock";
  export let currentSegment = undefined;
  export let hoveredSegment = undefined;
  export let persistentAdImage = false;
  export let advertConsent = "personalized";
  export let analyticsConsent = "allowed";
  export let analyticsCustomUrl = undefined;
  export let analyticsTag = undefined;
  export let writeToken = undefined;
  export let transitions = []; // TODO: turn into a documented feature
  export let controlPanel = undefined; // TODO: turn into a documented feature
  export const addEventListener = (...args) => controller.addEventListener(...args);
  export const removeEventListener = (...args) => controller.removeEventListener(...args);

  // These are set automatically.
  export let initialProps = {};
  export let showBottomWidget = false;
  export let showMediaSession = false;
  export let isFullScreen = false;
  export let mediaElement = undefined;
  export let userInterface = undefined;
  export let widgetInterface = undefined;
  export let controller = undefined;
  export let persistentAdvert = undefined;
  export let analyticsUrl = undefined;
  export let analyticsId = undefined;
  export let listenSessionId = undefined;
  export let sessionCreatedAt = undefined;
  export let emitPlayEvent = undefined;
  export let prevPercentage = 0;
  export let segmentWidgets = [];
  export let segmentContainers = new SegmentContainers(arr => segmentWidgets = arr);
  export let segmentClickables = new SegmentClickables();
  export let segmentHighlights = new SegmentHighlights();
  export const onEvent = e => controller.processEvent({ emittedFrom, ...e });

  $: introOrOutro = introsOutros[introsOutrosIndex];
  $: activeAdvert = adverts[advertIndex];
  $: contentItem = content[contentIndex];

  $: interfaceStyle = isFullScreen ? "video" : playerStyle;
  $: emittedFrom = videoBehindWidget ? "bottom-widget" : "inline-player";

  $: widgetTarget = findByQuery(widgetTarget);
  $: controlPanel = findByQuery(controlPanel);

  $: videoBehindWidget = showBottomWidget && widgetStyle === "video" && !isFullScreen;
  $: videoBehindStatic = showUserInterface && interfaceStyle === "video" && !videoBehindWidget;

  $: projectId, contentId, playlistId, sourceId, sourceUrl, playlist, onEvent(identifiersEvent());
  $: onStatusChange(playerApiUrl, projectId, writeToken, (statusEvent) => onEvent(statusEvent));

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

  $: segmentHighlights.update("current", currentSegment, highlightSections, highlightColor);
  $: segmentHighlights.update("hovered", hoveredSegment, highlightSections, highlightColor);

  // TODO: if timedTransitions changes then re-apply all transitions.
  $: applyTransitions(transitions, controller, currentTime);
</script>

<MediaElement
  bind:this={mediaElement}
  {onEvent}
  {content}
  {contentIndex}
  {introOrOutro}
  {activeAdvert}
  {advertConsent}
  bind:playbackState
  bind:duration
  bind:currentTime
  bind:playbackRate
  bind:prevPercentage
  {videoBehindWidget}
  {videoBehindStatic}
  {widgetPosition}
  {widgetWidth} />

{#if showUserInterface}
  <UserInterface
    bind:this={userInterface}
    {onEvent}
    playerStyle={interfaceStyle}
    {callToAction}
    {skipButtonStyle}
    {playlistStyle}
    {playlistToggle}
    {downloadFormats}
    {playerTitle}
    {content}
    {contentIndex}
    {duration}
    {currentTime}
    {playbackState}
    {playbackRate}
    {activeAdvert}
    {persistentAdvert}
    {textColor}
    {backgroundColor}
    {iconColor}
    {logoIconEnabled}
    videoIsBehind={videoBehindStatic} />
{/if}

{#if showBottomWidget || widgetTarget}
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
      {playerTitle}
      fixedPosition={!widgetTarget && widgetPosition}
      fixedWidth={widgetWidth}
      {content}
      {contentIndex}
      {duration}
      {currentTime}
      {playbackState}
      {playbackRate}
      {activeAdvert}
      {persistentAdvert}
      {textColor}
      {backgroundColor}
      {iconColor}
      {logoIconEnabled}
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
      {duration}
      currentTime={showRealTimeInWidget ? currentTime : widgetSegment.startTime}
      playbackState={showRealTimeInWidget ? playbackState : "paused"}
      {activeAdvert}
      {persistentAdvert}
      {textColor}
      {backgroundColor}
      {iconColor} />
  </ExternalWidget>
{/each}

{#if controlPanel}
  <ExternalWidget root={controlPanel}>
    <ControlPanel
      bind:projectId
      bind:contentId
      bind:playlistId
      bind:sourceId
      bind:sourceUrl
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
      bind:duration
      bind:currentTime
      bind:playbackState
      bind:playbackRate
      bind:widgetStyle
      bind:widgetPosition
      bind:widgetWidth
      bind:widgetTarget
      bind:textColor
      bind:backgroundColor
      bind:iconColor
      bind:highlightColor
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

<StyleReset />
