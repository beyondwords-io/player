<script>
  import formatTime from "../../helpers/formatTime";

  export let currentTime = 0;
  export let duration = 0;
</script>

<span class="playback-time">
  {formatTime(currentTime)} / {formatTime(duration)}
</span>

<style>
  .playback-time {
    font-size: 0.625rem;
    font-weight: 300;
    white-space: nowrap;
  }
</style>
