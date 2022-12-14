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

  export let playerStyle = "podcast";
  export let playbackState = "playing";
  export let skipButtons = "segments";
  export let advertUrl = undefined;
  //export let advertUrl = "https://deliveroo.com";

  let width;
  $: isMobile = width < 375;
</script>

<div class="beyondwords-player {playerStyle}" class:mobile={isMobile} bind:clientWidth={width}>
  <div class="playback-controls">
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
</div>

<style>
  .beyondwords-player :global(*) {
    font-family: "InterVariable", sans-serif;
    color: #323232;
  }

  .beyondwords-player {
    box-sizing: border-box;
    background: #fafafa;
  }

  .standard {
    min-width: 300px;
    max-width: 700px;
    height: 3rem;
    padding: 0.25rem;
    border-radius: 1.5625rem;
  }

  .podcast {
    min-width: 300px;
    max-width: 700px;
    height: 6rem;
    padding: 0.25rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: flex-end;
  }

  .playback-controls {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .mobile .playback-controls {
    flex-direction: row-reverse;
  }
</style>
