<script>
  import VolumeUp from "./svg_icons/VolumeUp.svelte";
  import blobForImageUrl from "../helpers/blobForImageUrl";
  import blobForSvgNode from "../helpers/blobForSvgNode";
  const imageSizes = [96, 128, 192, 256, 384, 512];

  export let contentItem;
  export let activeAdvert;
  export let playbackState;
  export let backgroundColor;
  export let iconColor;

  let fallbackSvgs = imageSizes.map(() => undefined);

  $: isStopped = playbackState === "stopped";
  $: isAdvert = activeAdvert && !isStopped;

  $: activeBackgroundColor = isAdvert && activeAdvert?.backgroundColor || backgroundColor;
  $: activeIconColor = isAdvert && activeAdvert?.iconColor || iconColor;

  $: imageUrl = isAdvert && activeAdvert.imageUrl || contentItem.imageUrl;

  $: navigator.mediaSession.metadata ||= new MediaMetadata();
  $: navigator.mediaSession.metadata.title = "content title";
  // $: navigator.mediaSession.metadata.artist = projectTitle; // TODO: maybe add later
  // $: navigator.mediaSession.metadata.album = playlistTitle; // TODO: maybe add later

  $: pngArtworks = imageUrl ? imageSizes.map(s => blobForImageUrl(imageUrl, s, s)) : [];
  $: urlArtworks = imageUrl ? [{ src: imageUrl, sizes: "any" }] : [];
  $: svgArtworks = imageUrl ? [] : imageSizes.map((s, i) => blobForSvgNode(fallbackSvgs[i], s, s));

  $: artworks = Promise.all([...pngArtworks, ...urlArtworks, ...svgArtworks.filter(a => a)]);
  $: artworks.then(arr => navigator.mediaSession.metadata.artwork = arr);
</script>

{#each imageSizes as size, i}
  <div bind:this={fallbackSvgs[i]} style="display: none">
    <VolumeUp fill={activeBackgroundColor} color={activeIconColor} scale={size / 18} zoom={0.65} />
  </div>
{/each}
