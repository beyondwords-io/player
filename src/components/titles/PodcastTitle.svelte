<script>
  export let title;
  export let larger = false;
  export let maxLines = 1;
</script>

<div class="podcast-title" class:larger class:one-line={maxLines === 1} class:n-lines={maxLines > 1} style="--n: {maxLines}">
  {title}
</div>

<style>
  .podcast-title {
    font-size: 0.625rem;
    font-weight: 300;
    line-height: 1.2;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .one-line {
    white-space: nowrap;
  }

  .n-lines {
    max-height: calc(0.625rem * 1.2 * var(--n));
    display: -webkit-box;

            line-clamp: var(--n);
    -webkit-line-clamp: var(--n);
    -webkit-box-orient: vertical;
  }

  .larger {
    font-size: 0.75rem;
    font-weight: 500;
  }
</style>
