<script>
  export let body;
  export let isMobile;
</script>

<div class="summary-text" class:mobile={isMobile}>
  <div class="body">{body}</div>
</div>

<style>
  .body {
    font-size: 0.625rem;
    font-weight: 300;
    line-height: 1.2;
  }

  .body {
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
