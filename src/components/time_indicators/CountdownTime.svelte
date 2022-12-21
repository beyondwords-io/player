<script>
  import formatTime from "../../helpers/formatTime";

  export let text;
  export let remaining;
</script>

<span class="countdown-time">
  {text} • {formatTime(remaining)}
</span>

<style>
  .countdown-time {
    font-size: 0.625rem;
    font-weight: 300;
  }
</style>
