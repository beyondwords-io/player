<script>
  import translate from "../../helpers/translate";

  export let duration = 0;
  export let durationFormat = undefined;
  export let bold = false;
  export let scale = 1;
  export let color = "#323232";

  $: minutes = Math.max(1, Math.round((duration || 0) / 60));
  $: seconds = Math.round(duration || 0) % 60;
</script>

<div class="duration-in-mins" class:bold={bold} style="font-size: {10 * scale}px; color: {color}">
  {#if durationFormat}
    {durationFormat(minutes, seconds, translate)}
  {:else}
    {translate("minutesSingularOrPlural").replace("{n}", minutes)}
  {/if}
</div>

<style>
  .duration-in-mins {
    font-weight: 300;
    white-space: nowrap;
  }

  .bold {
    font-weight: 700;
  }
</style>
