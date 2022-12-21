<script>
  export let src;
  export let alt;
</script>

<img class="large-image" src={src} alt={alt} />

<style>
  .large-image {
    width: 5rem;
    height: 5rem;
    background: white;
    border-radius: 0.375rem;
    grid-row: 1 / span 2;
  }
</style>
