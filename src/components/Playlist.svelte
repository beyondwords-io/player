<script>
  import VolumeUp from "./svg_icons/VolumeUp.svelte";
  import PodcastTitle from "./PodcastTitle.svelte";
  import DurationInMins from "./time_indicators/DurationInMins.svelte";

  export let style = "auto";
  export let podcasts = [];
  export let index = 0;
  export let isMobile;

  $: [mode, desktopRows, mobileRows] = style.split("-");

  $: mobileRows = mobileRows || desktopRows || 4;
  $: desktopRows = desktopRows || 5;
</script>

{#if mode === "open" || mode === "auto" && podcasts.length > 1}
  <div class="playlist" class:mobile={isMobile} style="--desktop-rows: {desktopRows}; --mobile-rows: {mobileRows}">
    {#each podcasts as { title, duration }, i}
      <div class="podcast" class:active={i === index}>
        {#if i === index}
          <span class="speaker"><VolumeUp /></span>
        {:else}
          <span class="number">{i + 1}</span>
        {/if}

        <span class="title">
          <PodcastTitle {title} maxLines={isMobile ? 3 : 2} />
        </span>

        <span class="duration">
          <DurationInMins {duration} bold={i === index} />
        </span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .playlist {
    margin-top: 1rem;
    background: #fafafa;
    border-radius: 0.25rem;
    padding-left: 0.25rem;
    padding-right: 0.625rem;
    overflow-y: scroll;
    max-height: calc(2.5rem * var(--desktop-rows));
  }

  .playlist.mobile {
    padding-left: 0;
    padding-right: 1rem;
    max-height: calc(5rem * var(--mobile-rows));
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
