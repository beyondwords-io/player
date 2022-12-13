<script>
  export let progress = 0;
</script>

<div class="progress-bar">
  <div class="progress" style="width: {progress * 100}%">
  </div>
</div>

<style>
  .progress-bar {
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #d9d9d9;
    margin: 0 0.5rem;
  }

  .progress {
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #323232;
  }
</style>
