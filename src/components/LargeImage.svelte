<script>
  export let src;
  export let alt;
  export let scale = 1;

  $: size = `${scale * 80}px`;
</script>

<img class="large-image" src={src} alt={alt} style="width: {size}; height: {size}" />

<style>
  .large-image {
    background: white;
    border-radius: 6px;
    overflow: hidden;
    grid-row: 1 / span 2;
  }
</style>
