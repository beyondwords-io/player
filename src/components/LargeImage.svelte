<script>
  export let src;
  export let alt;
  export let scale = 1;

  $: size = `${scale * 5}rem`;
</script>

<img class="large-image" src={src} alt={alt} style="width: {size}; height: {size}" />

<style>
  .large-image {
    background: white;
    border-radius: 0.375rem;
    grid-row: 1 / span 2;
  }
</style>
