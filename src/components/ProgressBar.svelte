<script>
  export let progress = 0;
  export let marginRight = 0;
</script>

<div class="progress-bar" style="margin-right: {marginRight}rem">
  <div class="progress" style="width: {progress * 100}%"></div>
</div>

<style>
  .progress-bar {
    flex-grow: 1;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #d9d9d9;
    display: flex;
    cursor: pointer;
  }

  .progress {
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #323232;
  }
</style>
