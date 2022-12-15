<script>
  import formatTime from "../../helpers/formatTime";

  export let text;
  export let remaining;
</script>

<span>{text} • {formatTime(remaining)}</span>

<style>
  span {
    font-size: 0.625rem;
    font-weight: 300;
  }
</style>
