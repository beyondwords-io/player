<script>
  import UserInterface from "./UserInterface.svelte";

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
</script>

{#if showUserInterface}
  <UserInterface
      {interfaceStyle}
      {skipButtonsStyle}
      {playlistStyle}
      {playerTitle}
      {podcasts}
      {podcastIndex}
      {currentTime}
      {playbackState}
      {currentAdvert}
  />
{/if}
