<script>
  export let playerStyle;
  export let isMobile;
  export let isAdvert;
  export let fixedPosition;
  export let scale;
  export let controlsOrder;
</script>

<div class="secondary-buttons {playerStyle} {controlsOrder}" class:mobile={isMobile} class:advert_={isAdvert} class:fixed={fixedPosition} style="--scale: {scale}">
  <slot></slot>
</div>

<style>
  .secondary-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: 24px;
  }

  .fixed {
    column-gap: 16px;
  }

  .right-to-left {
    flex-direction: row-reverse;
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

  .video.right-to-left {
    margin-left: 0;
    margin-right: auto;
  }

  .video.advert_ :global(.playlist-button) {
    display: none;
  }
</style>
