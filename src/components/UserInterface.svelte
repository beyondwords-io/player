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
  import DurationInMins from "./time_indicators/DurationInMins.svelte";
  import VolumeUp from "./icons/VolumeUp.svelte";

  export let style = "standard";
  export let state = "playing";
  export let skip = "segments";
  export let playlist = [
    { title: "Goldman Sachs", body: "Why the CHIPS Act Is Unlikely to Reduce US Reliance on Asia", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 120 },
    { title: "Goldman Sachs", body: "The UK is Expected to Slide into a More ‘Significant’ Recession", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 260 },
    { title: "Goldman Sachs", body: "Why Home Prices are Poised to Fall", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 300 },
    { title: "Goldman Sachs", body: "The Invasion of Zombie Companies that Wasn’t", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 480 },
    { title: "Goldman Sachs", body: "Is the US Dollar Too Strong?", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 180 },
    { title: "Goldman Sachs", body: "Why the CHIPS Act Is Unlikely to Reduce US Reliance on Asia", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 120 },
  ];
  export let advert = undefined;
  //export let advert = { url: "https://deliveroo.com", image: "https://s3-alpha-sig.figma.com/img/5961/0ae1/ad61ca37487eda4edd52891557abbc02?Expires=1672012800&Signature=n8~Lv2SrnAFbm8OKWFYKDHaKI~qc~1aWdR3cE~WjoxNaR6SCJpgosQKinU0XEP6VlDiPYSzUnHcdghmbKloZUTZahZHwJdIPRx8cA5RgkR6NiCPiFVTVrq4iLY6bE7pYDe39jsetJaGYwz5ZXX~F9RcXWntUaeIOy7jYKCIlWH4~bYdZfWSJd-NNCTESWOxTenjPwq5s6UGdtcqH9fNzLCri-3lpXtfNcgnEDWz-zIm02ykjAv2RNgIKGKiP4OkKTLV6~c8dzk7A~fWQ-eQTF13qbnilVEAsVv~2LO870T3DvefGIxriYuKRHsCchdbFP97iT2cjTnXv8Yw-hZev5w__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 15 };
  export let index = 1;
  export let time = advert ? 0 : 160;

  $: active = advert || playlist[index] || {};

  $: isStandard = style === "standard";
  $: isPodcast = style === "podcast";
  $: isIcon = style === "icon";

  $: isPlaying = state === "playing";
  $: isStopped = state === "stopped";

  let width;
  $: isMobile = width < 380 && !isIcon;
  $: isAdvert = advert && !isStopped;
</script>

<div class="user-interface {style}" class:mobile={isMobile} bind:clientWidth={width}>
  <div class="main">
    {#if isPodcast}
      <LargeImage src={active.image} />
      <SummaryText title={active.title} body={active.body} isMobile={isMobile} />
    {/if}

    <div class="controls" style="justify-content: {isAdvert ? "space-between" : "flex-start"}">
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
        <SkipButtons style={skip} />
      {/if}

      <TimeIndicator currentTime={time} duration={active.duration} playerStyle={style} {isAdvert} {isMobile} {isStopped} />

      {#if !isIcon && !isMobile && (!isStopped || isPodcast)}
        <ProgressBar progress={isStopped ? 0 : time / active.duration} marginRight={isStandard && !isAdvert ? 0.5 : 0} />
      {/if}

      {#if isAdvert && !isStopped}
        <AdvertLink href={active.url} playerStyle={style} />
        <AdvertButton href={active.url} scale={isIcon ? 0.8 : 1} />
      {/if}
    </div>

    {#if !isAdvert}
      <BeyondWords margin={isStandard ? 0.75 : isIcon ? 0.5 : 0} marginSide={isStandard && isMobile ? "left" : "right"} />
    {/if}
  </div>

  {#if playlist.length > 1 && !isIcon}
    <div class="playlist">
      {#each playlist as item, i}
        <div class="item" class:active={i === index}>
          {#if i === index}
            <span class="speaker"><VolumeUp /></span>
          {:else}
            <span class="number">{i + 1}</span>
          {/if}

          <span class="title">{item.body}</span>
          <span class="duration">
            <DurationInMins duration={item.duration} bold={i === index} />
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .user-interface {
    overflow: hidden;
  }

  .user-interface :global(*) {
    font-family: "InterVariable", sans-serif;
    color: #323232;
  }

  .main {
    box-sizing: border-box;
    background: #fafafa;
    column-gap: 0.5rem;
  }

  .controls {
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

  .standard.mobile .controls {
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

  .podcast.mobile .controls {
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
  }

  .mobile .item {
    height: 5rem;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
  }

  .number,
  .speaker {
    width: 2.5rem;
    text-align: center;
    font-weight: 700;
    flex-shrink: 0;
  }

  .mobile .number,
  .mobile .speaker {
    grid-row: 1 / span 2;
  }

  .active .title {
    font-weight: 700;
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
