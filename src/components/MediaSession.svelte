<script>
  import { tick } from "svelte";
  import VolumeUp from "./svg_icons/VolumeUp.svelte";
  import blobForImageUrl from "../helpers/blobForImageUrl";
  import blobForSvgNode from "../helpers/blobForSvgNode";
  import newEvent from "../helpers/newEvent";

  // Use these sizes: https://developer.mozilla.org/en-US/docs/Web/API/MediaMetadata
  const imageSizes = [96, 128, 192, 256, 384, 512];

  // https://developer.mozilla.org/en-US/docs/Web/API/MediaSession/setActionHandler
  const actionTypes = ["hangup", "nextslide", "nexttrack", "pause", "play", "previousslide", "previoustrack", "seekbackward", "seekforward", "seekto", "skipad", "stop", "togglecamera", "togglemicrophone"];

  export let content = [];
  export let contentIndex = 0;
  export let activeAdvert = undefined;
  export let playbackState = "stopped";
  export let skipButtonStyle = "auto";
  export let backgroundColor = "#F5F5F5";
  export let iconColor = "black";
  export let onEvent = () => {};

  let artwork = [];
  let failedUrls = new Set();

  let fallbackSvgs = imageSizes.map(() => undefined);
  let renderedSvgs = imageSizes.map(() => undefined);

  $: isStopped = playbackState === "stopped";
  $: isAdvert = activeAdvert && !isStopped;
  $: isPlaylist = content.length > 1;

  $: contentItem = content[contentIndex];
  $: skipStyle = skipButtonStyle === "auto" ? (isPlaylist ? "tracks" : "segments") : skipButtonStyle;

  $: showSeekButtons = !isAdvert && skipStyle !== "tracks";
  $: showTrackButtons = !isAdvert && skipStyle === "tracks";

  $: background = isAdvert && activeAdvert?.backgroundColor || backgroundColor;
  $: foreground = isAdvert && activeAdvert?.iconColor || iconColor;
  $: background, foreground, renderedSvgs = imageSizes.map((_, i) => tick().then(() => fallbackSvgs[i]));

  $: imageUrl_ = isAdvert && activeAdvert.imageUrl || contentItem.imageUrl;
  $: imageUrl = failedUrls.has(imageUrl_) ? null : imageUrl_;

  $: pngArtworks = imageUrl ? imageSizes.map(s => blobForImageUrl(imageUrl, s, s)) : [];
  $: urlArtworks = imageUrl ? [{ src: imageUrl, sizes: "any" }] : [];
  $: svgArtworks = imageUrl ? [] : imageSizes.map((s, i) => blobForSvgNode(renderedSvgs[i], s, s));

  $: artworks = Promise.all([...pngArtworks, ...urlArtworks, ...svgArtworks]);
  const onReject = () => failedUrls = failedUrls.add(imageUrl);

  $: title = contentItem?.title || "";
  $: artworks.then(arr => artwork = arr).catch(onReject);
  $: artist = ""; // TODO: maybe set to projectTitle
  $: album = ""; // TODO: maybe set to playlistTitle

  $: navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album, artwork });
  $: navigator.mediaSession.setByPlayer = true;

  // Remove existing handlers, e.g. set by the user's website or other players.
  $: actionTypes.forEach(type => {
    // Chrome doesn't support the 'skipad' action type and throws an error.
    try { navigator.mediaSession.setActionHandler(type, null); } catch (e) { /* Ignore */ }
  });

  $: navigator.mediaSession.setActionHandler("play", () => {
    onEvent(newEvent({
      type: "PressedPlay",
      description: "The play button was pressed.",
      initiatedBy: "media-session-api",
    }));
  });

  $: navigator.mediaSession.setActionHandler("pause", () => {
    onEvent(newEvent({
      type: "PressedPause",
      description: "The pause button was pressed.",
      initiatedBy: "media-session-api",
    }));
  });

  $: navigator.mediaSession.setActionHandler("seekto", () => {
    // TODO
  });

  $: navigator.mediaSession.setActionHandler("seekbackward", showSeekButtons ? () => {
    onEvent(newEvent({
      type: "PressedSeekBack",
      description: "The seek backward button was pressed.",
      initiatedBy: "media-session-api",
      seconds: 10, // TODO
    }));
  } : null);

  $: navigator.mediaSession.setActionHandler("seekforward", showSeekButtons ? () => {
    onEvent(newEvent({
      type: "PressedSeekAhead",
      description: "The seek ahead button was pressed.",
      initiatedBy: "media-session-api",
      seconds: 10, // TODO
    }));
  } : null);

  $: navigator.mediaSession.setActionHandler("previoustrack", showTrackButtons ? () => {
    onEvent(newEvent({
      type: "PressedPrevTrack",
      description: "The previous track button was pressed.",
      initiatedBy: "media-session-api",
    }));
  } : null);

  $: navigator.mediaSession.setActionHandler("nexttrack", showTrackButtons ? () => {
    onEvent(newEvent({
      type: "PressedNextTrack",
      description: "The next track button was pressed.",
      initiatedBy: "media-session-api",
    }));
  } : null);

  // TODO: maybe set playbackState/positionState if it isn't working for VAST ads.
  // TODO: update event docs with alternative initiator for these events
</script>

<div class="media-session">
  {#each imageSizes as size, i}
    <div bind:this={fallbackSvgs[i]} style="display: none">
      <VolumeUp fill={background} color={foreground} scale={size / 18} zoom={0.65} />
    </div>
  {/each}
</div>
