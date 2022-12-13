<script>
  import "@fontsource/inter/variable.css";
  import PlayPauseButton from "./PlayPauseButton.svelte";
  import ListenPrompt from "./ListenPrompt.svelte";
  import PlaybackSpeed from "./PlaybackSpeed.svelte";
  import SkipButtons from "./SkipButtons.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import Logo from "./icons/Logo.svelte";
  import AdvertLink from "./AdvertLink.svelte";
  import AdvertButton from "./AdvertButton.svelte";
  import BeyondWords from "./BeyondWords.svelte";

  export let style = "standard";
  export let state = "playing";

  let width;
  $: isMobile = width < 375;
</script>

<div class="beyondwords-player {style}" class:mobile={isMobile} bind:clientWidth={width}>
  <PlayPauseButton isPlaying={state === "playing"} />

  {#if state === "stopped" }
    <ListenPrompt />
  {:else}
    <PlaybackSpeed />
    <SkipButtons style="segments" />
    <ProgressBar progress={0.33} style={isMobile ? "onlyslot" : "oneline"}>
      <PlaybackTime />
    </ProgressBar>
  {/if}

  <BeyondWords />
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
    padding-right: 0.75rem;
    box-sizing: border-box;
    border-radius: 1.5625rem;
    background: #fafafa;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .standard.mobile {
    flex-direction: row-reverse;
    padding-left: 0.75rem;
    padding-right: 0.25rem;
  }
</style>
