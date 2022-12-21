<script>
  import formatTime from "../../helpers/formatTime";

  export let text;
  export let remaining;
  export let scale = 1;
</script>

<span class="countdown-time" style="font-size: {0.625 * scale}rem">
  {text} • {formatTime(remaining)}
</span>

<style>
  .countdown-time {
    font-weight: 300;
  }
</style>
