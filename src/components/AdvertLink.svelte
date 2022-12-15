<script>
  export let href;
  export let isPodcast;

  $: text = new URL(href).hostname;
</script>

<a class="advert-link" href={href} target="_blank" rel="noreferrer" class:podcast={isPodcast}>
  {text}
</a>

<style>
  a.advert-link {
    font-size: 0.75rem;
    font-weight: 500;
    text-decoration: none;
    color: #00cdbc;
    border-bottom: 1px solid #00cdbc;
  }

  .podcast {
    position: absolute;
    top: 0.5rem;
  }
</style>
