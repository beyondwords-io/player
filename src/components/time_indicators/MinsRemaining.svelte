<script>
  export let remaining;

  const format = (time) => {
    let minutes = Math.ceil(time / 60).toString();

    return minutes;
  };
</script>

<span>{format(remaining)} min remaining</span>

<style>
  span {
    font-size: 0.625rem;
    font-weight: 300;
  }
</style>
