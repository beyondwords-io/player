<script>
  import MediaElement from "./MediaElement.svelte";
  import UserInterface from "./UserInterface.svelte";
  import GoogleAnalytics from "./GoogleAnalytics.svelte";
  import identifiersEvent from "../helpers/identifiersEvent";
  import onStatusChange from "../helpers/onStatusChange";

  export let playerApiUrl = "https://api.beyondwords.io/v1/projects/{id}/player";
  export let analyticsUrl = "https://metrics.beyondwords.io/events";
  export let projectId = undefined;
  export let contentId = undefined;
  export let playlistId = undefined;
  export let sourceId = undefined;
  export let sourceUrl = undefined;
  export let playlist = undefined;
  export let showUserInterface = false;
  export let playerStyle = "standard";
  export let callToAction = "Listen to this article";
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playerTitle = undefined;
  export let content = [];
  export let contentIndex = 0;
  export let adverts = [];
  export let advertIndex = -1;
  export let duration = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let playbackRate = 1;
  export let widgetStyle = "standard";
  export let widgetPosition = "auto";
  export let widgetWidth = "auto";
  export let textColor = "#111";
  export let backgroundColor = "#F5F5F5";
  export let iconColor = "rgba(0, 0, 0, 0.8)";
  export let advertConsent = "personalized";
  export let analyticsConsent = "allowed";
  export let analyticsCustomUrl = undefined;
  export let analyticsTag = undefined;
  export let writeToken = undefined;
  export const addEventListener = (...args) => controller.addEventListener(...args);
  export const removeEventListener = (...args) => controller.removeEventListener(...args);

  // These are set automatically.
  export let initialProps = {};
  export let showWidgetAtBottom = false;
  export let isFullScreen = false;
  export let mediaElement = undefined;
  export let userInterface = undefined;
  export let widgetInterface = undefined;
  export let controller = { processEvent: () => {} };
  export let analyticsId = undefined;
  export let listenSessionId = undefined;
  export let emitPlayEvent = undefined;
  export let prevPercentage = 0;

  $: projectId, contentId, playlistId, sourceId, sourceUrl, playlist, controller.processEvent(identifiersEvent());
  $: onStatusChange(projectId, writeToken, (statusChangeEvent) => controller.processEvent(statusChangeEvent));

  $: interfaceStyle = isFullScreen ? "video" : playerStyle;

  $: videoBehindWidget = showWidgetAtBottom && widgetStyle === "video" && !isFullScreen;
  $: videoBehindStatic = showUserInterface && interfaceStyle === "video" && !videoBehindWidget;

  $: activeAdvert = adverts[advertIndex];
  $: contentItem = content[contentIndex];
</script>

<MediaElement
  bind:this={mediaElement}
  onEvent={e => controller.processEvent(e)}
  {contentItem}
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
    onEvent={e => controller.processEvent({ ...e, fromWidget: false })}
    playerStyle={interfaceStyle}
    {callToAction}
    {skipButtonStyle}
    {playlistStyle}
    {playerTitle}
    {content}
    {contentIndex}
    {duration}
    {currentTime}
    {playbackState}
    {playbackRate}
    {activeAdvert}
    {textColor}
    {backgroundColor}
    {iconColor}
    videoIsBehind={videoBehindStatic} />
{/if}

{#if showWidgetAtBottom}
  <UserInterface
    bind:this={widgetInterface}
    onEvent={e => controller.processEvent({ ...e, fromWidget: true })}
    playerStyle={widgetStyle}
    {callToAction}
    {skipButtonStyle}
    playlistStyle="hide"
    {playerTitle}
    fixedPosition={widgetPosition}
    fixedWidth={widgetWidth}
    {content}
    {contentIndex}
    {duration}
    {currentTime}
    {playbackState}
    {playbackRate}
    {activeAdvert}
    {textColor}
    {backgroundColor}
    {iconColor}
    videoIsBehind={videoBehindWidget} />
{/if}

{#if analyticsTag}
  <GoogleAnalytics {analyticsTag} />
{/if}
