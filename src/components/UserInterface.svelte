<script>
  import "@fontsource/inter/variable.css";
  import LargeImage from "./LargeImage.svelte";
  import SummaryText from "./SummaryText.svelte";
  import PlayButton from "./PlayButton.svelte";
  import PauseButton from "./PauseButton.svelte";
  import ListenPrompt from "./ListenPrompt.svelte";
  import Duration from "./Duration.svelte";
  import PlaybackSpeed from "./PlaybackSpeed.svelte";
  import SkipButtons from "./SkipButtons.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import AdvertLink from "./AdvertLink.svelte";
  import AdvertButton from "./AdvertButton.svelte";
  import CountdownTime from "./CountdownTime.svelte";
  import BeyondWords from "./BeyondWords.svelte";

  export let playerStyle = "standard";
  export let playbackState = "playing";
  export let skipButtons = "segments";
  export let advertUrl = undefined;
  //export let advertUrl = "https://deliveroo.com";
  export let podcastImage = "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4";
  export let advertImage = "https://s3-alpha-sig.figma.com/img/5961/0ae1/ad61ca37487eda4edd52891557abbc02?Expires=1672012800&Signature=n8~Lv2SrnAFbm8OKWFYKDHaKI~qc~1aWdR3cE~WjoxNaR6SCJpgosQKinU0XEP6VlDiPYSzUnHcdghmbKloZUTZahZHwJdIPRx8cA5RgkR6NiCPiFVTVrq4iLY6bE7pYDe39jsetJaGYwz5ZXX~F9RcXWntUaeIOy7jYKCIlWH4~bYdZfWSJd-NNCTESWOxTenjPwq5s6UGdtcqH9fNzLCri-3lpXtfNcgnEDWz-zIm02ykjAv2RNgIKGKiP4OkKTLV6~c8dzk7A~fWQ-eQTF13qbnilVEAsVv~2LO870T3DvefGIxriYuKRHsCchdbFP97iT2cjTnXv8Yw-hZev5w__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4";
  export let summaryTitle = "Goldman Sachs";
  export let summaryText = "The UK is Expected to Slide into a More ‘Significant’ Recession";
  export let currentTime = 160;
  export let duration = 260;

  $: isAdvert = advertUrl && playbackState !== "stopped";

  let width;
  $: isMobile = width < 375;
</script>

<div class="beyondwords-player {playerStyle}" class:mobile={isMobile} bind:clientWidth={width}>
  {#if playerStyle === "podcast"}
    <LargeImage src={isAdvert ? advertImage : podcastImage} />

    <SummaryText text={summaryText} isMobile={isMobile}>
      {#if isAdvert}
        <AdvertLink href={advertUrl} />
      {:else}
        {summaryTitle}
      {/if}
    </SummaryText>
  {/if}

  <div class="playback-controls">
    {#if playbackState === "playing"}
      <PauseButton />
    {:else}
      <PlayButton />
    {/if}

    {#if playbackState === "stopped" && playerStyle !== "podcast" }
      <ListenPrompt duration={duration} />
    {:else}
      {#if playbackState !== "stopped" && !isAdvert}
        <PlaybackSpeed />
        <SkipButtons style={skipButtons} />
      {/if}

      <ProgressBar progress={playbackState === "stopped" ? 0 : currentTime / duration} showBar={!isMobile} multiline={playerStyle === "podcast"} justify={isAdvert ? "flex-end" : "center"} margin={isMobile || isAdvert ? 0 : 0.5}>
        {#if isAdvert}
          <CountdownTime text="Ad" remaining={15} />
        {:else if playbackState === "stopped"}
          <Duration duration={duration} />
        {:else}
          <PlaybackTime currentTime={currentTime} duration={duration} />
        {/if}
      </ProgressBar>

      {#if isAdvert}
        {#if playerStyle !== "podcast"}
          <AdvertLink href={advertUrl} />
        {/if}

        <AdvertButton href={advertUrl} />
      {/if}
    {/if}
  </div>

  {#if !isAdvert}
    <BeyondWords margin={playerStyle === "podcast" ? 0 : 0.75} marginSide={isMobile ? "left" : "right"} />
  {/if}
</div>

<style>
  .beyondwords-player :global(*) {
    font-family: "InterVariable", sans-serif;
    color: #323232;
  }

  .beyondwords-player {
    box-sizing: border-box;
    background: #fafafa;
    column-gap: 0.5rem;
  }

  .standard {
    min-width: 300px;
    max-width: 700px;
    height: 3rem;
    padding: 0.25rem;
    border-radius: 1.5625rem;
    display: flex;
    align-items: center;
  }

  .podcast {
    min-width: 300px;
    max-width: 700px;
    height: 6rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
  }

  .playback-controls {
    align-self: flex-end;
    flex-grow: 1;
    display: flex;
    align-items: center;
    column-gap: 0.5rem;
    grid-row: 2;
    grid-column: 2;
  }

  .mobile.standard {
    flex-direction: row-reverse;
  }

  .mobile.podcast {
    height: 9rem;
  }

  .mobile .playback-controls {
    flex-direction: row-reverse;
  }

  .mobile.podcast .playback-controls {
    grid-row: 3;
    grid-column: 1 / span 3;
  }
</style>
