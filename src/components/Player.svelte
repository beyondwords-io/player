<script>
  import MediaElement from "./MediaElement.svelte";
  import UserInterface from "./UserInterface.svelte";
  import PlayerApiClient from "../api_clients/playerApiClient";

  export let showUserInterface = false;
  export let interfaceStyle = "standard";
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playerTitle = undefined;
  export let content = [];
  export let contentIndex = 0;
  export let mediaDuration = 0;
  export let playbackTime = 0;
  export let playbackState = "stopped";
  export let playbackSpeed = 1;
  export let activeAdvert = undefined;
  export let widgetStyle = "standard";
  export let widgetPosition = "auto";
  export let widgetWidth = "auto";
  export let playerApiUrl = "https://api.beyondwords.io/v1";
  export let projectId = undefined;

  // These are set automatically.
  export let showWidgetAtBottom = false;
  export let mediaElement = undefined;
  export let userInterface = undefined;
  export let widgetInterface = undefined;
  export let controller = { processEvent: () => {} };
  export let playerApiClient = new PlayerApiClient(playerApiUrl, projectId);

  $: media = activeAdvert ? activeAdvert.media : content[contentIndex]?.media;
  $: mediaProps = { media, showUserInterface, userInterface, interfaceStyle, showWidgetAtBottom, widgetInterface, widgetStyle, widgetPosition, widgetWidth };

  $: interfaceProps = { interfaceStyle, skipButtonStyle, playlistStyle, playerTitle, content, contentIndex, mediaDuration, playbackTime, playbackState, playbackSpeed, activeAdvert };
  $: widgetProps = { ...interfaceProps, interfaceStyle: widgetStyle, fixedPosition: widgetPosition, fixedWidth: widgetWidth, playlistStyle: "hide" };
</script>

<MediaElement bind:this={mediaElement} onEvent={e => controller.processEvent(e)} {...mediaProps} />

{#if showUserInterface}
  <UserInterface bind:this={userInterface} onEvent={e => controller.processEvent({ ...e, fromWidget: false })} {...interfaceProps} />
{/if}

{#if showWidgetAtBottom}
  <UserInterface bind:this={widgetInterface} onEvent={e => controller.processEvent({ ...e, fromWidget: true })} {...widgetProps} />
{/if}
