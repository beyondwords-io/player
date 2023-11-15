<script>
  $: alreadyLoaded = window.daxListenerId;
  $: cacheBuster = Math.floor(Math.random() * 10000000000);
</script>

<svelte:head>
  {#if !alreadyLoaded}
    <script async src="https://geo.ads.audio.thisisdax.com/bulk_sync.js?cb={cacheBuster}"></script>
  {/if}
</svelte:head>
