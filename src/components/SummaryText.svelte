<script>
  export let title;
  export let body;

  export let isMobile;
</script>

<div class="summary-text" class:mobile={isMobile}>
  <div class="title">{title}</div>
  <div class="body">{body}</div>
</div>

<style>
  .title {
    height: 0.9375rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25;
    margin-bottom: 0.3125rem;
  }

  .body {
    font-size: 0.625rem;
    font-weight: 300;
    line-height: 1.2;
  }

  .title, .body {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .mobile .body {
    white-space: normal;
    max-height: 2.25rem;
    display: -webkit-box;

            line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
</style>
