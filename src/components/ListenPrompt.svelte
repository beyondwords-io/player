<script>
  export let text = "Listen to this article";
</script>

<div class="listen-prompt">
  <div class="text">{text}</div>
</div>

<style>
  .listen-prompt {
    flex-grow: 1;
    height: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .text {
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }
</style>
