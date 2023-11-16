<script>
  import newEvent from "../helpers/newEvent";
  import translate from "../helpers/translate";
  import blurElement from "../helpers/blurElement";

  export let src;
  export let href;
  export let alt = "Player Image";
  export let size = 80;
  export let onEvent = () => {};

  const handleClick = () => {
    if (!href) { return; }

    onEvent(newEvent({
      type: "PressedAdvertImage",
      description: "The advert image was pressed to open the click-through URL in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

{#if href}
  <a class="large-image" {href} target="_blank" style="width: {size}px; height: {size}px" on:click={handleClick} on:mouseup={blurElement} aria-label={translate("visitAdvert")}>
    <img src={src} alt={alt} style="width: {size}px; height: {size}px" />
  </a>
{:else}
  <img class="large-image" src={src} alt={alt} style="width: {size}px; height: {size}px" />
{/if}

<style>
  .large-image {
    border-radius: 6px;
    overflow: hidden;
    grid-row: 1 / span 2;
  }
</style>
