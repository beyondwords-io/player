<script>
  import VolumeUp from "./svg_icons/VolumeUp.svelte";
  import DurationInMins from "./time_indicators/DurationInMins.svelte";

  export let podcasts = [];
  export let index = 0;
  export let isMobile;
</script>

<div class="playlist" class:mobile={isMobile}>
  {#each podcasts as podcast, i}
    <div class="podcast" class:active={i === index}>
      {#if i === index}
        <span class="speaker"><VolumeUp /></span>
      {:else}
        <span class="number">{i + 1}</span>
      {/if}

      <span class="title">{podcast.body}</span>
      <span class="duration">
        <DurationInMins duration={podcast.duration} bold={i === index} />
      </span>
    </div>
  {/each}
</div>

<style>
  .playlist {
    margin-top: 1rem;
    background: #fafafa;
    border-radius: 0.25rem;
    padding-left: 0.25rem;
    padding-right: 0.625rem;
    max-height: 12.5rem;
    overflow-y: scroll;
  }

  .playlist.mobile {
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

  .podcast {
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

  .mobile .podcast {
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
