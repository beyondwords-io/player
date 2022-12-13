<script>
  export let text;
  export let href;
</script>

<a class="advert-link" href={href} target="_blank">
  {text}
</a>

<style>
  a.advert-link {
    font-size: 0.75rem;
    font-weight: 500;
    text-decoration: none;
    color: #00cdbc;
    border-bottom: 1px solid #00cdbc;
    margin-right: 1rem;
  }
</style>
