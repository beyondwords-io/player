<script>
  import { tick } from "svelte";
  import VolumeUp from "./svg_icons/VolumeUp.svelte";
  import blobForImageUrl from "../helpers/blobForImageUrl";
  import blobForSvgNode from "../helpers/blobForSvgNode";
  const imageSizes = [96, 128, 192, 256, 384, 512];

  export let contentItem;
  export let activeAdvert;
  export let playbackState;
  export let backgroundColor;
  export let iconColor;

  let artwork = [];
  let fallbackSvgs = imageSizes.map(() => undefined);
  let renderedSvgs = imageSizes.map(() => undefined);

  $: isStopped = playbackState === "stopped";
  $: isAdvert = activeAdvert && !isStopped;

  $: background = isAdvert && activeAdvert?.backgroundColor || backgroundColor;
  $: foreground = isAdvert && activeAdvert?.iconColor || iconColor;
  $: background, foreground, renderedSvgs = imageSizes.map((_, i) => tick().then(() => fallbackSvgs[i]));

  $: imageUrl = isAdvert && activeAdvert.imageUrl || contentItem.imageUrl;

  $: pngArtworks = imageUrl ? imageSizes.map(s => blobForImageUrl(imageUrl, s, s)) : [];
  $: urlArtworks = imageUrl ? [{ src: imageUrl, sizes: "any" }] : [];
  $: svgArtworks = imageUrl ? [] : imageSizes.map((s, i) => blobForSvgNode(renderedSvgs[i], s, s));

  $: artworks = Promise.all([...pngArtworks, ...urlArtworks, ...svgArtworks]);

  $: title = contentItem?.title || "";
  $: artworks.then(arr => artwork = arr);
  $: artist = ""; // TODO: maybe set to projectTitle
  $: album = ""; // TODO: maybe set to playlistTitle

  $: navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album, artwork });
</script>

{#each imageSizes as size, i}
  <div bind:this={fallbackSvgs[i]} style="display: none">
    <VolumeUp fill={background} color={foreground} scale={size / 18} zoom={0.65} />
  </div>
{/each}
