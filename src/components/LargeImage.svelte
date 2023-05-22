<script>
  import translate from "../helpers/translate";

  export let src;
  export let href;
  export let alt = "Player Image";
  export let scale = 1;

  $: size = `${scale * 80}px`;
</script>

<a class="large-image" {href} target="_blank" style="width: {size}; height: {size}" aria-label={translate("visitAdvert")}>
  <img src={src} alt={alt} style="width: {size}; height: {size}" />
</a>

<style>
  .large-image {
    background: rgba(0, 0, 0, 0.5);
    border-radius: 6px;
    overflow: hidden;
    grid-row: 1 / span 2;
  }
</style>
