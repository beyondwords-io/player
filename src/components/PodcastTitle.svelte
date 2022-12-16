<script>
  export let title;
  export let isMobile;
</script>

<div class="podcast-title">{title}</div>

<style>
  .podcast-title {
    font-size: 0.625rem;
    font-weight: 300;
    line-height: 1.2;
  }

  .podcast-title {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .mobile .podcast-title {
    white-space: normal;
    max-height: 2.25rem;
    display: -webkit-box;

            line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
</style>
