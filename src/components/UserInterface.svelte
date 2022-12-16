<script>
  import "@fontsource/inter/variable.css";
  import LargeImage from "./LargeImage.svelte";
  import SummaryText from "./SummaryText.svelte";
  import PlayButton from "./PlayButton.svelte";
  import PauseButton from "./PauseButton.svelte";
  import ListenPrompt from "./ListenPrompt.svelte";
  import PlaybackSpeed from "./PlaybackSpeed.svelte";
  import SkipButtons from "./SkipButtons.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import AdvertLink from "./AdvertLink.svelte";
  import AdvertButton from "./AdvertButton.svelte";
  import BeyondWords from "./BeyondWords.svelte";
  import TimeIndicator from "./TimeIndicator.svelte";

  export let playerStyle = "standard";
  $: isStandard = playerStyle === "standard";
  $: isPodcast = playerStyle === "podcast";
  $: isIcon = playerStyle === "icon";

  export let playbackState = "playing";
  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";

  //export let advertUrl = undefined;
  export let advertUrl = "https://deliveroo.com";
  $: isAdvert = advertUrl && !isStopped;

  export let skipButtons = "segments";
  export let podcastImage = "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4";
  export let advertImage = "https://s3-alpha-sig.figma.com/img/5961/0ae1/ad61ca37487eda4edd52891557abbc02?Expires=1672012800&Signature=n8~Lv2SrnAFbm8OKWFYKDHaKI~qc~1aWdR3cE~WjoxNaR6SCJpgosQKinU0XEP6VlDiPYSzUnHcdghmbKloZUTZahZHwJdIPRx8cA5RgkR6NiCPiFVTVrq4iLY6bE7pYDe39jsetJaGYwz5ZXX~F9RcXWntUaeIOy7jYKCIlWH4~bYdZfWSJd-NNCTESWOxTenjPwq5s6UGdtcqH9fNzLCri-3lpXtfNcgnEDWz-zIm02ykjAv2RNgIKGKiP4OkKTLV6~c8dzk7A~fWQ-eQTF13qbnilVEAsVv~2LO870T3DvefGIxriYuKRHsCchdbFP97iT2cjTnXv8Yw-hZev5w__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4";
  export let title = "Goldman Sachs";
  export let body = "The UK is Expected to Slide into a More ‘Significant’ Recession";

  export let currentTime = isAdvert ? 0 : 160;
  export let duration = isAdvert ? 15 : 260;

  let width;
  $: isMobile = width < 380 && !isIcon;
</script>

<div class="beyondwords-player {playerStyle}" class:mobile={isMobile} bind:clientWidth={width}>
  <div class="main">
    {#if isPodcast}
      <LargeImage src={isAdvert ? advertImage : podcastImage} />
      <SummaryText title={isAdvert ? "" : title} body={body} isMobile={isMobile} />
    {/if}

    <div class="playback-controls" style="justify-content: {isAdvert ? "space-between" : "flex-start"}">
      {#if isPlaying}
        <PauseButton scale={isIcon ? 0.8 : 1} />
      {:else}
        <PlayButton scale={isIcon ? 0.8 : 1} />
      {/if}

      {#if isStandard && isStopped || (isIcon && !isAdvert)}
        <ListenPrompt />
      {/if}

      {#if !isIcon && !isStopped && !isAdvert}
        <PlaybackSpeed />
        <SkipButtons style={skipButtons} />
      {/if}

      <TimeIndicator {currentTime} {duration} {playerStyle} {isAdvert} {isMobile} {isStopped} />

      {#if !isIcon && !isMobile && (!isStopped || isPodcast)}
        <ProgressBar progress={isStopped ? 0 : currentTime / duration} marginRight={isStandard && !isAdvert ? 0.5 : 0} />
      {/if}

      {#if isAdvert && !isStopped}
        <AdvertLink href={advertUrl} playerStyle={playerStyle} />
        <AdvertButton href={advertUrl} scale={isIcon ? 0.8 : 1} />
      {/if}
    </div>

    {#if !isAdvert}
      <BeyondWords margin={isStandard ? 0.75 : isIcon ? 0.5 : 0} marginSide={isStandard && isMobile ? "left" : "right"} />
    {/if}
  </div>

  <div class="playlist">
    <div class="item">
      <span class="title">Why the CHIPS Act Is Unlikely to Reduce US Reliance on Asia</span>
      <span class="duration">2 min</span>
    </div>

    <div class="item">
      <span class="title">The UK is Expected to Slide into a More ‘Significant’ Recession</span>
      <span class="duration">4 min</span>
    </div>

    <div class="item">
      <span class="title">Why Home Prices are Poised to Fall</span>
      <span class="duration">5 min</span>
    </div>

    <div class="item">
      <span class="title">The Invasion of Zombie Companies that Wasn’t</span>
      <span class="duration">8 min</span>
    </div>

    <div class="item">
      <span class="title">Is the US Dollar Too Strong?</span>
      <span class="duration">3 min</span>
    </div>

    <div class="item">
      <span class="title">Why the CHIPS Act Is Unlikely to Reduce US Reliance on Asia</span>
      <span class="duration">2 min</span>
    </div>

    <div class="item">
      <span class="title">The UK is Expected to Slide into a More ‘Significant’ Recession</span>
      <span class="duration">4 min</span>
    </div>

    <div class="item">
      <span class="title">Why Home Prices are Poised to Fall</span>
      <span class="duration">5 min</span>
    </div>

    <div class="item">
      <span class="title">The Invasion of Zombie Companies that Wasn’t</span>
      <span class="duration">8 min</span>
    </div>

    <div class="item">
      <span class="title">Is the US Dollar Too Strong?</span>
      <span class="duration">3 min</span>
    </div>
  </div>
</div>

<style>
  .beyondwords-player {
    overflow: hidden;
  }

  .beyondwords-player :global(*) {
    font-family: "InterVariable", sans-serif;
    color: #323232;
  }

  .main {
    box-sizing: border-box;
    background: #fafafa;
    column-gap: 0.5rem;
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

  .standard {
    min-width: 300px;
  }

  .standard .main {
    height: 3rem;
    padding: 0.25rem;
    border-radius: 1.5625rem;
    display: flex;
    align-items: center;
  }

  .standard.mobile .main {
    flex-direction: row-reverse;
  }

  .standard.mobile .playback-controls {
    flex-direction: row-reverse;
  }

  .podcast {
    min-width: 300px;
  }

  .podcast .main {
    height: 6rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
  }

  .podcast.mobile .main {
    height: 9rem;
  }

  .podcast.mobile .playback-controls {
    flex-direction: row-reverse;
    grid-row: 3;
    grid-column: 1 / span 3;
  }

  .icon {
    min-width: 200px;
    max-width: 200px;
  }

  .icon .main {
    height: 2.5rem;
    padding: 0.25rem;
    border-radius: 1.25rem;
    display: flex;
    align-items: center;
  }

  .playlist {
    margin-top: 1rem;
    background: #fafafa;
    border-radius: 0.25rem;
    counter-reset: item-number 0;
    padding-left: 0.25rem;
    padding-right: 0.625rem;
    max-height: 12.5rem;
    overflow-y: scroll;
  }

  .mobile .playlist {
    padding-left: 0;
    padding-right: 1rem;
    max-height: 25rem;
  }

  .playlist::-webkit-scrollbar {
    width: 0.5rem;
  }

  .playlist::-webkit-scrollbar-thumb {
    background: #323232;
    border-radius: 1rem;
    border: 0.125rem solid #fafafa;
  }

  .item {
    height: 2.5rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto;
    align-items: center;
    column-gap: 0.5rem;

    font-size: 0.625rem;
    font-weight: 300;
    line-height: 1.2;
    counter-increment: item-number 1;
  }

  .mobile .item {
    height: 5rem;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
  }

  .item:before {
    content: counter(item-number);
    width: 2.5rem;
    text-align: center;
    font-weight: 700;
    flex-shrink: 0;
  }

  .mobile .item:before {
    grid-row: 1 / span 2;
  }

  .title {
    flex-grow: 1;
  }

  .mobile .title {
    align-self: flex-end;
  }

  .duration {
    margin: 0.25rem 0;
    white-space: nowrap;
  }

  .mobile .duration {
    align-self: flex-start;
  }
</style>
