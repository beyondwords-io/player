<script>
  export let title;
  export let interfaceStyle;
  export let scale = 1;
</script>

<div class="player-title {interfaceStyle}" style="font-size: {0.75 * scale}rem">
  {title}
</div>

<style>
  .player-title {
    font-weight: 500;
    line-height: 1.25;

    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .large {
    height: 0.9375rem;
    margin-bottom: 0.3125rem;
  }

  .standard,
  .small {
    flex-grow: 1;
    height: 2rem;
    display: flex;
  }

  .screen {
    height: 1.875rem;
    position: relative;
    bottom: 1.25rem;
  }
</style>
