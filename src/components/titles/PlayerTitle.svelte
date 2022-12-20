<script>
  export let title;
  export let interfaceStyle;
</script>

<div class="player-title {interfaceStyle}">
  {title}
</div>

<style>
  .player-title {
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25;

    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .podcast {
    height: 0.9375rem;
    margin-bottom: 0.3125rem;
  }

  .standard,
  .icon {
    flex-grow: 1;
    height: 2rem;
    display: flex;
  }
</style>
