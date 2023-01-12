<script>
  import formatTime from "../../helpers/formatTime";

  export let playbackTime = 0;
  export let duration = 0;
  export let scale = 1;
  export let color = "#323232";
</script>

<span class="playback-time" style="font-size: {0.625 * scale}rem; color: {color}">
  {formatTime(playbackTime)} / {formatTime(duration)}
</span>

<style>
  .playback-time {
    font-weight: 300;
    white-space: nowrap;
  }
</style>
