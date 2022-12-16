<script>
  export let href;
  export let playerStyle;

  $: text = new URL(href).hostname;
</script>

<a class="advert-link {playerStyle}" href={href} target="_blank" rel="noreferrer">
  {text}
</a>

<style>
  a.advert-link {
    font-size: 0.75rem;
    font-weight: 500;
    text-decoration: none;
    color: #00cdbc;
    border-bottom: 1px solid #00cdbc;
    white-space: nowrap;
  }

  .podcast {
    position: absolute;
    left: 6rem;
    top: 0.5rem;
  }

  .icon {
    position: absolute;
    top: 0.25rem;
    left: 2.75rem;
  }
</style>
