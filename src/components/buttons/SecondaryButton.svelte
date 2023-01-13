<script>
  export let activeStyle;
  export let isMobile;
  export let isAdvert;
  export let scale;
</script>

<div class="secondary-button {activeStyle}" class:mobile={isMobile} class:advert={isAdvert} style="--scale: {scale}">
  <slot></slot>
</div>

<style>
  .secondary-button {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .advert {
    display: none;
  }

  .small {
    display: none;
  }

  .standard.mobile {
    display: none;
  }

  .large.mobile {
    width: calc(2.5rem * var(--scale));
    height: calc(2.5rem * var(--scale));
  }

  .screen {
    width: calc(2.5rem * var(--scale));
    height: calc(2.5rem * var(--scale));
  }

  .screen.advert {
    display: flex;
  }

  .video {
    margin-left: auto;
  }

  .video.advert {
    margin-left: 0;
    display: flex;
  }
</style>
