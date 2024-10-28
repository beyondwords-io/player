<script>
  import formatTime from "../../helpers/formatTime";

  export let currentTime = 0;
  export let duration = 0;
  export let scale = 1;
  export let color = "#323232";
</script>

<span class="playback-time" style="font-size: {10 * scale}px; color: {color}">
  {formatTime(currentTime)} / {formatTime(duration)}
</span>

<style>
  .playback-time {
    font-weight: 300;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
</style>
