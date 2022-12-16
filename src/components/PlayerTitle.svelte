<script>
  export let title;
</script>

<div class="player-title">{title}</div>

<style>
  .player-title {
    height: 0.9375rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25;
    margin-bottom: 0.3125rem;

    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
</style>
