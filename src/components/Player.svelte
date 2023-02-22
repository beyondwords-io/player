<script>
  import MediaElement from "./MediaElement.svelte";
  import UserInterface from "./UserInterface.svelte";
  import identifiersEvent from "../helpers/identifiersEvent";

  export let playerApiUrl = "https://api.beyondwords.io/v1";
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
  export let duration = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let playbackRate = 1;
  export let activeAdvert = undefined;
  export let widgetStyle = "standard";
  export let widgetPosition = "auto";
  export let widgetWidth = "auto";
  export let textColor = "#111";
  export let backgroundColor = "#F5F5F5";
  export let iconColor = "rgba(0, 0, 0, 0.8)";

  // These are set automatically.
  export let showWidgetAtBottom = false;
  export let videoIsMaximized = false;
  export let mediaElement = undefined;
  export let userInterface = undefined;
  export let widgetInterface = undefined;
  export let controller = { processEvent: () => {} };

  $: projectId, contentId, playlistId, sourceId, sourceUrl, playlist, controller.processEvent(identifiersEvent());

  $: interfaceStyle = videoIsMaximized ? "video" : playerStyle;

  $: videoBehindWidget = showWidgetAtBottom && widgetStyle === "video" && !videoIsMaximized;
  $: videoBehindStatic = showUserInterface && interfaceStyle === "video" && !videoBehindWidget;

  $: media = activeAdvert ? activeAdvert.media : content[contentIndex]?.media;
  $: mediaProps = { media, videoBehindWidget, videoBehindStatic, widgetPosition, widgetWidth };

  $: interfaceProps = { playerStyle: interfaceStyle, callToAction, skipButtonStyle, playlistStyle, playerTitle, content, contentIndex, duration, currentTime, playbackState, playbackRate, activeAdvert, textColor, backgroundColor, iconColor, videoIsBehind: videoBehindStatic };
  $: widgetProps = { ...interfaceProps, playerStyle: widgetStyle, fixedPosition: widgetPosition, fixedWidth: widgetWidth, playlistStyle: "hide", videoIsBehind: videoBehindWidget };
</script>

<MediaElement bind:this={mediaElement} bind:duration bind:currentTime bind:playbackRate onEvent={e => controller.processEvent(e)} {...mediaProps} />

{#if showUserInterface}
  <UserInterface bind:this={userInterface} onEvent={e => controller.processEvent({ ...e, fromWidget: false })} {...interfaceProps} />
{/if}

{#if showWidgetAtBottom}
  <UserInterface bind:this={widgetInterface} onEvent={e => controller.processEvent({ ...e, fromWidget: true })} {...widgetProps} />
{/if}
