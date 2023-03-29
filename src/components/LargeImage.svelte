<script>
  export let src;
  export let alt = "Player Image";
  export let scale = 1;

  $: size = `${scale * 80}px`;
</script>

<img class="large-image" src={src} alt={alt} style="width: {size}; height: {size}" />

<style>
  .large-image {
    background: rgba(0, 0, 0, 0.5);
    border-radius: 6px;
    overflow: hidden;
    grid-row: 1 / span 2;
  }
</style>
