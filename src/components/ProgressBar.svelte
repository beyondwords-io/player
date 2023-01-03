<script>
  export let progress = 0;
  export let fullWidth = false;
  export let hidden = false;
</script>

<div class="progress-bar" class:full-width={fullWidth} class:hidden>
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
    transition: opacity 0.5s;
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
    background: linear-gradient(to right, #943bfc, #fc3a41);
  }

  .hidden {
    opacity: 0;
    pointer-events: none;
  }
</style>
