<script>
  import imageBlobForUrl from "../helpers/imageBlobForUrl";
  const imageSizes = [96, 128, 192, 256, 384, 512];

  export let contentItem;
  export let activeAdvert;
  export let playbackState;

  $: isStopped = playbackState === "stopped";
  $: isAdvert = activeAdvert && !isStopped;

  $: imageUrl = isAdvert && activeAdvert.imageUrl || contentItem.imageUrl; // TODO: fallback image?

  $: navigator.mediaSession.metadata ||= new MediaMetadata();
  $: navigator.mediaSession.metadata.title = "content title";
  // $: navigator.mediaSession.metadata.artist = projectTitle; // TODO: maybe add later
  // $: navigator.mediaSession.metadata.album = playlistTitle; // TODO: maybe add later

  $: blobArtworks = imageSizes.map(s => imageBlobForUrl(imageUrl, s, s));
  $: urlArtwork = { src: imageUrl, sizes: "any" };

  $: artworks = Promise.all([...blobArtworks, urlArtwork]);
  $: artworks.then(arr => navigator.mediaSession.metadata.artwork = arr);
</script>
