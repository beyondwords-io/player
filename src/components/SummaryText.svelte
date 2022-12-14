<script>
  export let text;
</script>

<div class="summary-text">
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
</style>
