<script>
  import formatTime from "../../helpers/formatTime";

  export let currentTime = 0;
  export let duration = 0;
  export let scale = 1;
</script>

<span class="playback-time" style="font-size: {0.625 * scale}rem">
  {formatTime(currentTime)} / {formatTime(duration)}
</span>

<style>
  .playback-time {
    font-weight: 300;
    white-space: nowrap;
  }
</style>
