<script>
  export let text;
  export let remaining;

  const format = (time) => {
    let minutes = Math.floor(time / 60).toString();
    let seconds = Math.round(time % 60).toString();

    if (seconds.length < 2) { seconds = `0${seconds}`; }

    return `${minutes}:${seconds}`;
  };
</script>

<span>{text} • {format(remaining)}</span>

<style>
  span {
    font-size: 0.625rem;
    font-weight: 300;
  }
</style>
