<script>
  export let text;
  export let isMobile;
</script>

<div class="summary-text" class:mobile={isMobile}>
  <div class="title"><slot></slot></div>
  <div class="text">{text}</div>
</div>

<style>
  .title {
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25;
    margin-bottom: 0.3125rem;
  }

  .text {
    font-size: 0.625rem;
    font-weight: 300;
    line-height: 1.2;
  }

  .title, .text {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .mobile .text {
    white-space: normal;
    max-height: 2.25rem;
    display: -webkit-box;

            line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
</style>
