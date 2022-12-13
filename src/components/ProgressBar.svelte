<script>
  export let progress = 0;
  export let style = "oneline";
  export let grow = true;
</script>

<div class="progress-bar {style}" class:grow={grow}>
  <slot></slot>

  <div class="outer">
    <div class="inner" style="width: {progress * 100}%"></div>
  </div>
</div>

<style>
  .progress-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .grow {
    flex-grow: 1;
  }

  .oneline {
    margin: 0 0.5rem;
  }

  .multiline {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 0.25rem;
  }

  .onlyslot {
    justify-content: center;
  }

  .onlyslot .outer {
    display: none;
  }

  .outer {
    flex-grow: 1;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #d9d9d9;
    display: flex;
    cursor: pointer;
  }

  .inner {
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #323232;
  }
</style>
