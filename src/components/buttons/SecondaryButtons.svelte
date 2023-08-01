<script>
  export let playerStyle;
  export let isMobile;
  export let isAdvert;
  export let scale;
</script>

<div class="secondary-buttons {playerStyle}" class:mobile={isMobile} class:advert_={isAdvert} style="--scale: {scale}">
  <slot></slot>
</div>

<style>
  .secondary-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: 24px;
  }

  .advert_ {
    display: none;
  }

  .small {
    display: none;
  }

  .standard.mobile {
    display: none;
  }

  .large.mobile {
    width: calc(40px * var(--scale));
    height: calc(40px * var(--scale));
  }

  .screen {
    width: calc(40px * var(--scale));
    height: calc(40px * var(--scale));
  }

  .screen.advert_ {
    display: flex;
  }

  .video {
    margin-left: auto;
  }

  .video.advert_ {
    margin-left: 0;
    display: flex;
  }
</style>
