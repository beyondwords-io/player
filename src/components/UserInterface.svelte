<script>
  import "@fontsource/inter/variable.css";
  import PlayPauseButton from "./PlayPauseButton.svelte";
  import ListenPrompt from "./ListenPrompt.svelte";
  import PlaybackSpeed from "./PlaybackSpeed.svelte";
  import SkipButtons from "./SkipButtons.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import AdvertLink from "./AdvertLink.svelte";
  import AdvertButton from "./AdvertButton.svelte";
  import BeyondWords from "./BeyondWords.svelte";

  export let playerStyle = "standard";
  export let playbackState = "playing";
  export let skipButtons = "segments";

  let width;
  $: isMobile = width < 375;
</script>

<div class="beyondwords-player {playerStyle}" class:mobile={isMobile} bind:clientWidth={width}>
  <PlayPauseButton isPlaying={playbackState === "playing"} />

  {#if playbackState === "stopped" }
    <ListenPrompt />
  {:else}
    <PlaybackSpeed />
    <SkipButtons style={skipButtons} />
    <ProgressBar progress={0.33} style={isMobile ? "onlyslot" : "oneline"}>
      <PlaybackTime />
    </ProgressBar>
  {/if}

    <BeyondWords isMobile={isMobile} />
</div>

<style>
  .beyondwords-player :global(*) {
    font-family: "InterVariable", sans-serif;
    color: #323232;
  }

  .standard {
    min-width: 300px;
    max-width: 700px;
    height: 3rem;
    padding: 0.25rem;
    box-sizing: border-box;
    border-radius: 1.5625rem;
    background: #fafafa;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .standard.mobile {
    flex-direction: row-reverse;
  }
</style>
