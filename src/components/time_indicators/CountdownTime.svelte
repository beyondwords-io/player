<script>
  import formatTime from "../../helpers/formatTime";

  export let text;
  export let remaining;
  export let scale = 1;
  export let color = "#323232";
</script>

<span class="countdown-time" style="font-size: {10 * scale}px; color: {color}">
  {text} • {formatTime(remaining)}
</span>

<style>
  .countdown-time {
    font-weight: 300;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
</style>
