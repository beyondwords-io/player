<script>
  export let duration = 0;

  $: minutes = Math.round(duration / 60);
</script>

<div>{minutes} min</div>

<style>
  div {
    font-size: 0.625rem;
    font-weight: 300;
  }
</style>
