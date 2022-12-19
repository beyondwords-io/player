<script>
  import UserInterface from "./UserInterface.svelte";

  export let PlayerClass = undefined;
  export let playerInstance = undefined;

  export let showUserInterface = false;
  export let interfaceStyle = "standard";
  export let skipButtonsStyle = "segments";
  export let playlistStyle = "auto-5-4";
  export let playerTitle = undefined;

  export let podcasts = [];
  export let podcastIndex = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let currentAdvert = undefined;

  export let showWidgetAtBottom = false;
  export let widgetStyle = "standard";
  export let widgetPosition = "center";

  $: userInterfaceProps = {
      interfaceStyle,
      skipButtonsStyle,
      playlistStyle,
      playerTitle,
      podcasts,
      podcastIndex,
      currentTime,
      playbackState,
      currentAdvert,
  };
</script>

{#if showUserInterface}
  <UserInterface {...userInterfaceProps} />
{/if}

{#if showWidgetAtBottom}
  <UserInterface {...userInterfaceProps} interfaceStyle={widgetStyle} fixedPosition={widgetPosition} playlistStyle="hide" />
{/if}
