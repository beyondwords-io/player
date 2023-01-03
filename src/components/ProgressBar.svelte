<script>
  export let progress = 0;
  export let fullWidth = false;
</script>

<div class="progress-bar" class:full-width={fullWidth}>
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

  .full-width {
    position: absolute;
    left: 0;
    right: 0;
    top: -0.5rem;
    border-radius: 0;
  }

  .full-width .progress {
    border-radius: 0;
  }
</style>
