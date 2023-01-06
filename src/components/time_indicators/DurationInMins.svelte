<script>
  export let duration = 0;
  export let bold = false;
  export let scale = 1;
  export let color = "#323232";

  $: minutes = Math.round((duration || 0) / 60);
</script>

<div class="duration-in-mins" class:bold={bold} style="font-size: {0.625 * scale}rem; color: {color}">
  {minutes} min
</div>

<style>
  .duration-in-mins {
    font-weight: 300;
  }

  .bold {
    font-weight: 700;
  }
</style>
