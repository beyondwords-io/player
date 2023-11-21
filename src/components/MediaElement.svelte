<script>
  import { onMount, tick } from "svelte";
  import VastContainer from "./VastContainer.svelte";
  import orderedMediaSources from "../helpers/orderedMediaSources";
  import loadHlsIfNeeded from "../helpers/loadHlsIfNeeded";
  import { loadMetadata, loadMedia } from "../helpers/loadMedia";
  import timeFragment, { EPSILON } from "../helpers/timeFragment";
  import newEvent from "../helpers/newEvent";
  import translate from "../helpers/translate";
  import blurElement from "../helpers/blurElement";
  import findSegmentIndex from "../helpers/findSegmentIndex";
  import findLoadedMedia from "../helpers/findLoadedMedia";
  import chooseSegmentElement from "../helpers/chooseSegmentElement";

  export let content;
  export let contentIndex;
  export let introOrOutro;
  export let activeAdvert;
  export let advertConsent;
  export let maxImageSize;
  export let projectId;
  export let playlistId;
  export let contentId;
  export let contentLanguage;
  export let platform;
  export let vendorIdentifier;
  export let bundleIdentifier;
  export let playbackState;
  export let duration;
  export let currentTime;
  export let playbackRate;
  export let prevPercentage;
  export let showUserInterface;
  export let videoBehindWidget;
  export let videoBehindStatic;
  export let videoMightBeShown;
  export let widgetPosition;
  export let widgetWidth;
  export let widgetTarget;
  export let onEvent = () => {};
  export let metadataLoaded;
  export let video = undefined;

  let Hls, hls;
  let timeout;
  let time = 0;
  let loadCount = 0;
  let initialTime = currentTime;
  let loadedMedia;
  let timeUpdateTimeout;

  const setTime = (t) => tick().then(() => time = t);
  const preferVideo = () => videoMightBeShown;

  const play = () => video?.paused && video?.play()?.catch(handlePlayError);
  const pause = () => !video?.paused && video?.pause();

  $: stylesNeeded = content.length > 0 && (videoBehindStatic || videoBehindWidget);
  $: if (stylesNeeded) { import("../helpers/loadTheStyles.ts"); }

  $: !activeAdvert && setTime(currentTime);
  $: currentTime = time;

  $: contentItem = content[contentIndex];
  $: segments = contentItem?.segments || [];

  $: contentIndex, introOrOutro, activeAdvert, loadCount += 1;
  $: isFirstLoad = loadCount === 1;
  $: startPosition = isFirstLoad && initialTime;

  $: mediaObject = introOrOutro;
  $: !introOrOutro && (mediaObject = activeAdvert);
  $: !introOrOutro && !activeAdvert && (mediaObject = contentItem);

  $: sources = orderedMediaSources(mediaObject, preferVideo(), startPosition);

  $: sources, metadataLoaded = false;
  $: sources, prevPercentage = 0;

  $: loadHlsIfNeeded(sources[0], video).then(lib => Hls = lib);
  $: hls = loadMetadata(sources[0], video, Hls, hls, handleHlsError, handleLoadedMetadata, play);

  $: (playbackState === "playing" || preferVideo()) && loadMedia(hls, startPosition);

  $: vastUrl = activeAdvert?.vastUrl;
  $: placement = activeAdvert?.placement;
  $: customUrl = activeAdvert?.clickThroughUrl;

  $: metadataLoaded && !vastUrl && (playbackState === "playing" ? play() : pause());

  $: videoBehindStaticWidget = videoBehindWidget && widgetTarget;
  $: videoBehindSlidingWidget = videoBehindWidget && !widgetTarget;

  $: position = videoBehindSlidingWidget && widgetPosition !== "auto" ? `fixed-${widgetPosition}` : "";
  $: style = videoBehindSlidingWidget ? `width: ${widgetWidth}` : "";

  $: atTheStart = playbackState !== "playing" && currentTime <= EPSILON;

  // TODO: is it possible to also set the currentTime when changing to video for continuity?
  $: videoMightBeShown && loadedMedia?.format === "audio" && atTheStart && (mediaObject = mediaObject);

  $: segmentIndex = introOrOutro || activeAdvert || atTheStart ? -1 : findSegmentIndex(segments, currentTime);
  $: segmentIndex, handleSegmentUpdate();

  $: videoBehindSlidingWidget && animate();

  const animate = () => {
    if (timeout) { clearTimeout(timeout); }
    timeout = setTimeout(() => timeout = null, 500);
  };

  const handlePlay = () => {
    onEvent(newEvent({
      type: "PlaybackPlaying",
      description: "The media began playing from its current playback time.",
      initiatedBy: "media",
    }));
  };

  const handlePause = () => {
    onEvent(newEvent({
      type: "PlaybackPaused",
      description: "The media became paused at its current playback time.",
      initiatedBy: "media",
    }));
  };

  const handleEnded = () => {
    onEvent(newEvent({
      type: "PlaybackEnded",
      description: "The media finished playing because it reached the end.",
      initiatedBy: "media",
    }));
  };

  const handlePlaying = () => {
    clearTimeout(timeUpdateTimeout);
    timeUpdateTimeout = setTimeout(() => {
      setTime(video.currentTime - 0.1);
    }, 3000);
  };

  const handleDurationChange = () => {
    onEvent(newEvent({
      type: "DurationUpdated",
      description: "The media's duration was updated.",
      initiatedBy: "media",
    }));
  };

  const handleLoadedMetadata = ({ fromHls }) => {
    const hlsBeingUsed = hls !== "not-used";
    const alreadyEmitted = hlsBeingUsed && !fromHls;

    if (alreadyEmitted) { return; }

    metadataLoaded = true;
    loadedMedia = findLoadedMedia(sources, video);

    onEvent(newEvent({
      type: "MetadataLoaded",
      description: "The media finished loading its metadata.",
      initiatedBy: "media",
      loadedMedia,
    }));
  };

  const handleLoadedData = () => {
    loadedMedia = findLoadedMedia(sources, video);

    onEvent(newEvent({
      type: "MediaLoaded",
      description: "The media finished loading its first frame of data.",
      initiatedBy: "media",
      loadedMedia,
    }));
  };

  const handleTimeUpdate = () => {
    // Ensure the correct duration is sent to analytics for vast ads.
    if (vastUrl) { return; }

    clearTimeout(timeUpdateTimeout);
    timeUpdateTimeout = undefined;
    onEvent(newEvent({
      type: "CurrentTimeUpdated",
      description: "The media's current time was updated.",
      initiatedBy: "media",
    }));
  };

  const handleSeeked = () => {
    onEvent(newEvent({
      type: "MediaSeeked",
      description: "The media completed the seek operation.",
      initiatedBy: "media",
    }));
  };

  const handleSegmentUpdate = () => {
    const segment = segments[segmentIndex];
    const segmentElement = chooseSegmentElement(segment);

    onEvent(newEvent({
      type: "CurrentSegmentUpdated",
      description: "The media's current segment was updated.",
      initiatedBy: "media",
      segment,
      contentIndex,
      segmentIndex,
      segmentElement, // Might be undefined.
      precedence: 0,
    }));
  };

  const handleRateChange = () => {
    onEvent(newEvent({
      type: "PlaybackRateUpdated",
      description: "The media's playback rate was updated.",
      initiatedBy: "media",
    }));
  };

  const handlePlayError = (error) => {
    if (error?.name === "AbortError") { play(); return; }
    if (error?.name !== "NotAllowedError") { throw error; }

    onEvent(newEvent({
      type: "PlaybackNotAllowed",
      description: "The media cannot play because there was no user event.",
      initiatedBy: "media",
    }));
  };

  const handleSourceError = (sourceIndex) => () => {
    console.warn(`BeyondWords.Player: error while loading ${sources[sourceIndex]?.contentType} source`);

    const isLastSource = sourceIndex === sources.length - 1;
    if (!isLastSource) { return; }

    onEvent(newEvent({
      type: "PlaybackErrored",
      description: "The media failed to play.",
      initiatedBy: "media",
      mediaType: "native",
      mediaUrl: sources[0].url,
      errorMessage: "The video tag contains sources but none are playable.",
    }));
  };

  const handleHlsError = async (event, data) => {
    if (!data.fatal) { return; }

    hls?.destroy?.();
    hls = null;

    onEvent(newEvent({
      type: "PlaybackErrored",
      description: "The media failed to play.",
      initiatedBy: "media",
      mediaType: "HLS",
      mediaUrl: sources[0].url,
      errorMessage: `${data.type} ${data.details}`,
    }));
  };

  const handleFullScreenChange = () => {
    onEvent(newEvent({
      type: "FullScreenModeUpdated",
      description: "The browser entered or exited full screen mode.",
      initiatedBy: "browser",
    }));
  };

  onMount(() => {
    const listener1 = addEventListener("fullscreenchange", handleFullScreenChange);
    const listener2 = addEventListener("webkitfullscreenchange", handleFullScreenChange);

    return () => {
      removeEventListener("fullscreenchange", listener1);
      removeEventListener("fullscreenchange", listener2);
    };
  });
</script>

{#if content.length > 0}
  <div class="media-element {position}" class:animating={timeout} class:behind-static={videoBehindStatic || videoBehindStaticWidget} class:behind-sliding-widget={videoBehindSlidingWidget} class:headless={!showUserInterface} {style}>
    <div class="inner">
      <!-- svelte-ignore a11y-media-has-caption -->
      <video bind:this={video}
             bind:duration
             bind:currentTime={time}
             bind:playbackRate
             preload="metadata"
             playsinline
             disablepictureinpicture
             on:play={handlePlay}
             on:pause={handlePause}
             on:ended={handleEnded}
             on:playing={handlePlaying}
             on:durationchange={handleDurationChange}
             on:loadedmetadata={handleLoadedMetadata}
             on:loadeddata={handleLoadedData}
             on:timeupdate={handleTimeUpdate}
             on:seeked={handleSeeked}
             on:ratechange={handleRateChange}>

        {#if hls !== "pending" && !window.disableMediaLoad}
          {#each sources as { url, contentType, format }, i}
            <source src={`${url}${timeFragment(isFirstLoad, initialTime, format)}`} type={contentType} on:error={handleSourceError(i)}>
          {/each}
        {/if}
      </video>

      {#if vastUrl}
        <VastContainer {onEvent} {vastUrl} {placement} {advertConsent} {maxImageSize} {projectId} {playlistId} {contentId} {contentLanguage} {platform} {vendorIdentifier} {bundleIdentifier} {video} bind:playbackState bind:duration bind:currentTime />
      {/if}

      {#if customUrl}
        <a class="custom-advert-link" href={customUrl} target="_blank" on:mouseup={blurElement} aria-label={translate("visitAdvert")}>&nbsp;</a>
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(.beyondwords-player) {
    position: relative;
  }

  .media-element {
    display: none;
    align-items: center;
    justify-content: center;
    background: black;
    overflow: hidden;
    min-width: 300px;
  }

  .media-element:not(.headless) {
    border-radius: 8px;
  }

  .inner {
    width: 100%;
    height: 0;
    padding-bottom: 56.25%;
    position: relative;
  }

  .inner video {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .behind-static {
    display: flex;
    position: absolute;
    width: 100%;
  }

  .headless {
    position: static;
  }

  .behind-sliding-widget {
    display: flex;
    position: fixed;
    width: 0;
    bottom: -100px /* ~!important */;
    right: 0;
    margin: 16px;
    animation: fly-widget 0.33s forwards;
    opacity: 0 /* ~!important */;
    z-index: 999;
  }

  .behind-sliding-widget:not(.animating) {
    bottom: 0;
    opacity: 1;
  }

  .fixed-left {
    right: auto;
    left: 0;
  }

  .fixed-center {
    left: 0;
    margin-left: auto;
    margin-right: auto;
    max-width: min(720px, 100% - 32px);
  }

  .custom-advert-link {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    text-decoration: none;
  }

  @keyframes fly-widget {
    from { bottom: -100px; opacity: 0; }
    to { bottom: 0; opacity: 1; }
  }

  :global(.beyondwords-player.maximized),
  :global(.beyondwords-player.maximized .external-widget) {
    display: flex;
    align-items: center;
    background: black;
  }

  :global(.beyondwords-player.maximized) .media-element {
    max-width: none;
    border-radius: 0;
    position: absolute;
  }
</style>
