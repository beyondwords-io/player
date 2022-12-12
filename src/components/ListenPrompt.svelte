<script>
  export let text = "Listen to this article";
</script>

<div class="listen-prompt">
  <div class="text">{text}</div>
  <div class="duration">4 min</div>
</div>

<style>
  .listen-prompt {
    height: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .text {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .duration {
    font-size: 0.625rem;
    font-weight: 300;
  }
</style>
