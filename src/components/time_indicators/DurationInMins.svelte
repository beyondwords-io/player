<script>
  export let duration = 0;
  export let bold = false;

  $: minutes = Math.round(duration / 60);
</script>

<div class:bold={bold}>{minutes} min</div>

<style>
  div {
    font-size: 0.625rem;
    font-weight: 300;
  }

  .bold {
    font-weight: 700;
  }
</style>
