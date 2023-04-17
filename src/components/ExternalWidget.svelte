<script>
  export let root = undefined;

  let element;

  $: target = typeof root === "string" ? null : root;
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
