<script>
  export let currentTime = 160;
  export let duration = 260;

  const format = (time) => {
    let minutes = Math.floor(time / 60).toString();
    let seconds = Math.round(time % 60).toString();

    if (minutes.length < 2) { minutes = `0${minutes}`; }
    if (seconds.length < 2) { seconds = `0${seconds}`; }

    return `${minutes}:${seconds}`;
  };
</script>

<span>{format(currentTime)} / {format(duration)}</span>

<style>
  span {
    font-size: 0.625rem;
    font-weight: 300;
    margin-left: 0.5rem;
  }
</style>
