<script>
  import "@fontsource/inter/variable.css";
  import LargeImage from "./LargeImage.svelte";
  import SummaryText from "./SummaryText.svelte";
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
  export let podcastImage = "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4";
  export let advertImage = "https://s3-alpha-sig.figma.com/img/5961/0ae1/ad61ca37487eda4edd52891557abbc02?Expires=1672012800&Signature=n8~Lv2SrnAFbm8OKWFYKDHaKI~qc~1aWdR3cE~WjoxNaR6SCJpgosQKinU0XEP6VlDiPYSzUnHcdghmbKloZUTZahZHwJdIPRx8cA5RgkR6NiCPiFVTVrq4iLY6bE7pYDe39jsetJaGYwz5ZXX~F9RcXWntUaeIOy7jYKCIlWH4~bYdZfWSJd-NNCTESWOxTenjPwq5s6UGdtcqH9fNzLCri-3lpXtfNcgnEDWz-zIm02ykjAv2RNgIKGKiP4OkKTLV6~c8dzk7A~fWQ-eQTF13qbnilVEAsVv~2LO870T3DvefGIxriYuKRHsCchdbFP97iT2cjTnXv8Yw-hZev5w__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4";
  export let summaryTitle = "Goldman Sachs";
  export let summaryText = "The UK is Expected to Slide into a More ‘Significant’ Recession";

  $: isAdvert = advertUrl && playbackState !== "stopped";

  let width;
  $: isMobile = width < 375;
</script>

<div class="beyondwords-player {playerStyle}" class:mobile={isMobile} bind:clientWidth={width}>
  {#if playerStyle === "podcast"}
    <LargeImage src={isAdvert ? advertImage : podcastImage} />
  {/if}

  <div class="main-content">
    {#if playerStyle === "podcast"}
      <SummaryText text={summaryText}>
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
        <ListenPrompt />
      {:else}
        {#if playbackState !== "stopped" && !isAdvert}
          <PlaybackSpeed />
          <SkipButtons style={skipButtons} />
        {/if}

        <ProgressBar progress={0.33} showBar={!isMobile} multiline={playerStyle === "podcast"} justify={isAdvert ? "flex-end" : "center"} margin={isMobile || isAdvert ? 0 : 0.5}>
          {#if isAdvert}
            <CountdownTime text="Ad" remaining={15} />
          {:else}
            <PlaybackTime />
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
    display: flex;
    gap: 0.5rem;
  }

  .standard {
    min-width: 300px;
    max-width: 700px;
    height: 3rem;
    padding: 0.25rem;
    align-items: center;
    border-radius: 1.5625rem;
  }

  .podcast {
    min-width: 300px;
    max-width: 700px;
    height: 6rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .main-content {
    height: 100%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .playback-controls {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .podcast .playback-controls {
    align-items: flex-end;
  }

  .mobile.beyondwords-player {
    flex-direction: row-reverse;
  }

  .mobile .playback-controls {
    flex-direction: row-reverse;
  }
</style>
