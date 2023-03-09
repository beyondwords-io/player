<script>
  export let analyticsTag;

  $: alreadyLoaded = window.gtag;
</script>

<svelte:head>
  {#if !alreadyLoaded}
    <script async src="https://www.googletagmanager.com/gtag/js?id={analyticsTag}"></script>

    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag("js", new Date());
    </script>
  {/if}
</svelte:head>
