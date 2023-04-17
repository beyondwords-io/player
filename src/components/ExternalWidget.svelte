<script>
  export let target;

  let element;

  $: target && element && target.appendChild(element);
</script>

<div bind:this={element} class="beyondwords-widget bwp">
  <slot></slot>
</div>

<style>
  .beyondwords-widget {
    position: relative;
  }
</style>
