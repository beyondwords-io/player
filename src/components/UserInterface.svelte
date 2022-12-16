<script>
  import "@fontsource/inter/variable.css";

  import PlayButton from "./buttons/PlayButton.svelte";
  import PauseButton from "./buttons/PauseButton.svelte";
  import SkipButtons from "./buttons/SkipButtons.svelte";
  import AdvertButton from "./buttons/AdvertButton.svelte";

  import AdvertLink from "./external_links/AdvertLink.svelte";
  import BeyondWords from "./external_links/BeyondWords.svelte";

  import LargeImage from "./LargeImage.svelte";
  import PlayerTitle from "./PlayerTitle.svelte";
  import PodcastTitle from "./PodcastTitle.svelte";
  import ListenPrompt from "./ListenPrompt.svelte";
  import PlaybackSpeed from "./PlaybackSpeed.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import TimeIndicator from "./TimeIndicator.svelte";
  import Playlist from "./Playlist.svelte";

  export let style = "podcast";
  export let state = "playing";
  export let skip = "segments";
  export let title = "Goldman Sachs";
  export let podcasts = [
    { title: "Why the CHIPS Act Is Unlikely to Reduce US Reliance on Asia", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 120 },
    { title: "The UK is Expected to Slide into a More ‘Significant’ Recession", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 260 },
    { title: "Why Home Prices are Poised to Fall", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 300 },
    { title: "The Invasion of Zombie Companies that Wasn’t", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 480 },
    { title: "Is the US Dollar Too Strong?", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 180 },
    { title: "Why the CHIPS Act Is Unlikely to Reduce US Reliance on Asia", image: "https://s3-alpha-sig.figma.com/img/54e1/386e/7684c4c867c6edfa10d410f2472d2bb5?Expires=1672012800&Signature=obeEwi9yepTTgo6OTrbHYQWopU5EgGuvacGRlAIXnrlodntsfkkD~9YySFnG0EBHMrwWxSS5wodSTsX~DQ4rBNLFBQwiHqbnjjsD7HPlV5CEp0GhZOf2mCBmLlOlO8KvfezcqCqqF2FRDbKie1xaGbej9oIMZcbexAmIAzi8fFzNtAUBKRIScsjzbtHsQ7zkW9L6G-5nIM4qLOwl9CGk3XIWwnCbt0Us6khzHhKBAtwnr77pDmDkrNOKKY963CVVosmGqBIUPRG1IRi6AmgWUU1Dvt8x6CfIV~rRWcEZKvBhSdp8~4U8omBgvDZnxdtXaXdgVj-RzywvJ4Cz-pCOYA__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 120 },
  ];
  export let advert = undefined;
  //export let advert = { url: "https://deliveroo.com", image: "https://s3-alpha-sig.figma.com/img/5961/0ae1/ad61ca37487eda4edd52891557abbc02?Expires=1672012800&Signature=n8~Lv2SrnAFbm8OKWFYKDHaKI~qc~1aWdR3cE~WjoxNaR6SCJpgosQKinU0XEP6VlDiPYSzUnHcdghmbKloZUTZahZHwJdIPRx8cA5RgkR6NiCPiFVTVrq4iLY6bE7pYDe39jsetJaGYwz5ZXX~F9RcXWntUaeIOy7jYKCIlWH4~bYdZfWSJd-NNCTESWOxTenjPwq5s6UGdtcqH9fNzLCri-3lpXtfNcgnEDWz-zIm02ykjAv2RNgIKGKiP4OkKTLV6~c8dzk7A~fWQ-eQTF13qbnilVEAsVv~2LO870T3DvefGIxriYuKRHsCchdbFP97iT2cjTnXv8Yw-hZev5w__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4", duration: 15 };
  export let index = 1;
  export let time = advert ? 0 : 160;

  $: isStandard = style === "standard";
  $: isPodcast = style === "podcast";
  $: isIcon = style === "icon";

  $: isPlaying = state === "playing";
  $: isStopped = state === "stopped";

  let width;
  $: isMobile = width < 380 && !isIcon;
  $: isAdvert = advert && !isStopped;
  $: iconScale = isIcon ? 0.8 : 1;

  $: podcast = podcasts[index] || {};
  $: duration = isAdvert ? advert.duration : podcast.duration;
</script>

<div class="user-interface {style}" class:mobile={isMobile} bind:clientWidth={width}>
  <div class="main">
    {#if isPodcast}
      <LargeImage src={isAdvert ? (advert.image || podcast.image) : podcast.image} />

      <div>
        <PlayerTitle title={isAdvert ? "" : title} />
        <PodcastTitle title={podcast.title} maxLines={isMobile ? 3 : 1} />
      </div>
    {/if}

    <div class="controls" style="justify-content: {isAdvert ? "space-between" : "flex-start"}">
      {#if isPlaying}
        <PauseButton scale={iconScale} />
      {:else}
        <PlayButton scale={iconScale} />
      {/if}

      {#if isStandard && isStopped || (isIcon && !isAdvert)}
        <ListenPrompt />
      {/if}

      {#if !isIcon && !isStopped && !isAdvert}
        <PlaybackSpeed />
        <SkipButtons style={skip} />
      {/if}

      <TimeIndicator currentTime={time} {duration} playerStyle={style} {isAdvert} {isMobile} {isStopped} />

      {#if !isIcon && !isMobile && (!isStopped || isPodcast)}
        <ProgressBar progress={isStopped ? 0 : time / duration} marginRight={isStandard && !isAdvert ? 0.5 : 0} />
      {/if}

      {#if isAdvert}
        <AdvertLink href={advert.url} playerStyle={style} />
        <AdvertButton href={advert.url} scale={iconScale} />
      {/if}
    </div>

    {#if !isAdvert}
      <BeyondWords margin={isStandard ? 0.75 : isIcon ? 0.5 : 0} marginSide={isStandard && isMobile ? "left" : "right"} />
    {/if}
  </div>

  {#if podcasts.length > 1 && !isIcon}
    <Playlist podcasts={podcasts} index={index} isMobile={isMobile} />
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
</style>
