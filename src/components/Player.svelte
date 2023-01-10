<script>
  import UserInterface from "./UserInterface.svelte";

  export let showUserInterface = false;
  export let interfaceStyle = "standard";
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playerTitle = undefined;
  export let podcasts = [];
  export let podcastIndex = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let currentAdvert = undefined;
  export let widgetStyle = "standard";
  export let widgetPosition = "auto";
  export let widgetWidth = "auto";

  // These are set automatically.
  export let showWidgetAtBottom = false;
  export let userInterface = undefined;
  export let widgetInterface = undefined;
  export let controller = { handleEvent: () => {} };

  $: props = { interfaceStyle, skipButtonStyle, playlistStyle, playerTitle, podcasts, podcastIndex, currentTime, playbackState, currentAdvert };
  $: widgetProps = { ...props, interfaceStyle: widgetStyle, fixedPosition: widgetPosition, fixedWidth: widgetWidth, playlistStyle: "hide" };
</script>

{#if showUserInterface}
  <UserInterface bind:this={userInterface} onEvent={e => controller.handleEvent(e)} {...props} />
{/if}

{#if showWidgetAtBottom}
  <UserInterface bind:this={widgetInterface} onEvent={e => controller.handleEvent(e)} {...widgetProps} />
{/if}
