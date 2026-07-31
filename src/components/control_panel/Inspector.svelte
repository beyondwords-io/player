<script>
  // What is actually loaded, so testing is not guesswork: the request that
  // produced it, what the project's settings said, and what the player resolved.
  export let snapshot = {};
  export let apiPayload = undefined;
  export let apiRequestUrl = undefined;

  $: settings = apiPayload?.settings || {};
  $: item = (snapshot.content || [])[snapshot.contentIndex || 0];

  $: variants = item ? [
    describeMedia("full", item.audio, item.video),
    describeMedia("summary", item.summarization?.audio, item.summarization?.video),
  ] : [];

  $: segments = item?.segments || [];
  $: sections = countBy(segments, (segment) => segment.section || "body");
  $: wordCount = segments.reduce((total, segment) => total + (segment.words?.length || 0), 0);

  // A rebuilt article is only clickable where a marker matches a segment.
  $: markers = typeof document === "undefined" ? [] : [...document.querySelectorAll("[data-beyondwords-marker]")];
  $: matchedMarkers = markers.filter((element) => (
    segments.some((segment) => segment.marker === element.dataset.beyondwordsMarker)
  )).length;

  const describeMedia = (name, audio, video) => {
    const sizes = (video || []).map((media) => media.videoSize?.name).filter((size) => size);
    const detail = [`${(audio || []).length} audio`, `${(video || []).length} video`];

    return `${name}: ${detail.join(" / ")}${sizes.length ? ` (${[...new Set(sizes)].join(", ")})` : ""}`;
  };

  const countBy = (array, fn) => array.reduce((counts, entry) => {
    const key = fn(entry);
    return { ...counts, [key]: (counts[key] || 0) + 1 };
  }, {});

  const seconds = (value) => (typeof value === "number" ? `${Math.round(value)}s` : "unknown");

  $: accessDescription = [
    (snapshot.segmentLimit ?? null) === null ? "full access" : `${snapshot.segmentLimit} segments`,
    item ? `ads ${item.adsEnabled ? "enabled" : "disabled"}` : undefined,
  ].filter((part) => part).join(", ");
</script>

<div class="inspector">
  {#if !apiPayload}
    <div class="empty">
      No content loaded. Enter a project ID plus a content or playlist ID, then Fetch.
    </div>
  {:else}
    <div class="row"><span>request</span><span class="value url">{apiRequestUrl}</span></div>

    {#if !item}
      <div class="row"><span>result</span><span class="value warn">no published and processed content</span></div>
    {:else}
      <div class="row"><span>content</span><span class="value">{item.id}</span></div>
      <div class="row"><span>title</span><span class="value">{item.title || "none"}</span></div>
      <div class="row"><span>duration</span><span class="value">{seconds(item.duration)}</span></div>

      {#each variants as variant (variant)}
        <div class="row"><span></span><span class="value">{variant}</span></div>
      {/each}

      <div class="row">
        <span>segments</span>
        <span class="value">
          {segments.length}
          {#if segments.length}({Object.entries(sections).map(([name, count]) => `${count} ${name}`).join(", ")}){/if}
        </span>
      </div>

      <div class="row">
        <span>words</span>
        <span class="value" class:warn={!wordCount}>
          {#if wordCount}
            present ({wordCount})
          {:else}
            absent: wordHighlightsEnabled was off when this was fetched
          {/if}
        </span>
      </div>

      <div class="row">
        <span>markers</span>
        <span class="value" class:warn={markers.length > 0 && matchedMarkers === 0}>
          {matchedMarkers} of {markers.length} in the page match a segment
        </span>
      </div>
    {/if}

    <div class="row">
      <span>tier</span>
      <span class="value">
        asked {snapshot.accessTier ?? "none"}, got {settings.access_tier ?? "none"}
      </span>
    </div>

    <div class="row"><span>limit</span><span class="value">{accessDescription}</span></div>

    <div class="row">
      <span>adverts</span>
      <span class="value">
        {(snapshot.adverts || []).length}
        {#if (snapshot.adverts || []).length}({snapshot.adverts.map((advert) => `${advert.placement} ${advert.type || "audio"}`).join(", ")}){/if}
      </span>
    </div>
  {/if}

  <div class="divider"></div>

  <div class="row"><span>style</span><span class="value">{snapshot.playerStyle} / {snapshot.embedMode} / {snapshot.theme}</span></div>
  <div class="row"><span>widget</span><span class="value">{snapshot.widgetStyle} {snapshot.showBottomWidget ? "(showing)" : ""}</span></div>
  <div class="row">
    <span>playback</span>
    <span class="value">
      {snapshot.playbackState} {seconds(snapshot.currentTime)} of {seconds(snapshot.duration)} at {snapshot.playbackRate}x
    </span>
  </div>
  <div class="row">
    <span>media</span>
    <span class="value">
      {#if snapshot.loadedMedia}
        {snapshot.loadedMedia.format}{snapshot.loadedMedia.videoSize?.name ? ` ${snapshot.loadedMedia.videoSize.name}` : ""}, {snapshot.loadedMedia.contentType}
      {:else}
        none loaded
      {/if}
    </span>
  </div>
  <div class="row">
    <span>item</span>
    <span class="value">{(snapshot.content || []).length ? `${(snapshot.contentIndex || 0) + 1} of ${snapshot.content.length}` : "none"}</span>
  </div>
  <div class="row"><span>segment</span><span class="value">{snapshot.currentSegment?.marker || "none"}</span></div>
</div>

<style>
  .inspector {
    margin: 8px 0;
  }

  .row {
    display: flex;
    column-gap: 8px;
    margin: 3px 0;
  }

  .row > span:first-child {
    flex: 0 0 60px;
    opacity: 0.6;
  }

  .value {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .url {
    font-size: 11px;
  }

  .warn {
    color: maroon;
  }

  .empty {
    padding: 6px 0;
    opacity: 0.7;
  }

  .divider {
    height: 1px;
    margin: 8px 0;
    background: rgba(0, 0, 0, 0.15);
  }

  .inspector, .row, .row > span, .empty {
    font-family: "InterVariable", sans-serif;
    font-size: 12px;
    color: black;
  }
</style>
