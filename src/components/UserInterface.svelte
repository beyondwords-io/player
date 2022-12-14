<script>
  import "@fontsource/inter/variable.css";
  import PlayButton from "./PlayButton.svelte";
  import PauseButton from "./PauseButton.svelte";
  import ListenPrompt from "./ListenPrompt.svelte";
  import PlaybackSpeed from "./PlaybackSpeed.svelte";
  import SkipButtons from "./SkipButtons.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import AdvertLink from "./AdvertLink.svelte";
  import AdvertButton from "./AdvertButton.svelte";
  import CountdownTime from "./CountdownTime.svelte";
  import BeyondWords from "./BeyondWords.svelte";

  export let playerStyle = "standard";
  export let playbackState = "stopped";
  export let skipButtons = "segments";
  export let advertUrl = "https://deliveroo.com";

  let width;
  $: isMobile = width < 375;
</script>

<div class="beyondwords-player {playerStyle}" class:mobile={isMobile} bind:clientWidth={width}>
  {#if playbackState === "paused"}
    <PlayButton />
  {:else}
    <PauseButton />
  {/if}

  {#if playbackState === "stopped" }
    <ListenPrompt />
  {:else}
    {#if !advertUrl}
      <PlaybackSpeed />
      <SkipButtons style={skipButtons} />
    {/if}

    <ProgressBar progress={0.33} showBar={!isMobile} justify={advertUrl ? "flex-end" : "center"} margin={isMobile || advertUrl ? 0 : 0.5}>
      {#if advertUrl}
        <CountdownTime text="Ad" remaining={15} />
      {:else}
        <PlaybackTime />
      {/if}
    </ProgressBar>

    {#if advertUrl}
      <AdvertLink href={advertUrl} />
      <AdvertButton href={advertUrl} />
    {/if}
  {/if}

  {#if playbackState === "stopped" || !advertUrl}
    <BeyondWords isMobile={isMobile} />
  {/if}
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
