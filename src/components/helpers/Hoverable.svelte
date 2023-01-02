<script>
  import { onDestroy } from "svelte";

  export let enabled;
  export let graceTime;
  export let isHovering = false;

  let timeout;

  const onEnter = () => {
    if (timeout) { clearTimeout(timeout); }
    isHovering = true;
  };

  const onLeave = () => {
    if (timeout) { clearTimeout(timeout); }
    timeout = setTimeout(() => isHovering = false, graceTime);
  };

  onDestroy(() => {
    if (timeout) { clearTimeout(timeout); }
    isHovering = false;
  });
</script>

{#if enabled}
  <div class="hoverable" on:mouseenter={onEnter} on:mouseleave={onLeave}>
    <slot></slot>
  </div>
{:else}
  <slot></slot>
{/if}
