<script>
  import { onDestroy } from "svelte";

  export let enabled;
  export let exitDelay = 0;
  export let idleDelay = Infinity;
  export let isHovering = false;

  let isExit, isIdle;
  let exitTimeout, idleTimeout;

  $: isHovering = enabled && !isExit && !isIdle;

  const onEnter = () => {
    if (exitTimeout) { clearTimeout(exitTimeout); }
    if (idleTimeout) { clearTimeout(idleTimeout); }

    isExit = false;
    isIdle = false;
  };

  const onLeave = () => {
    if (exitTimeout) { clearTimeout(exitTimeout); }

    isExit = false;
    exitTimeout = setTimeout(() => isExit = true, exitDelay);
  };

  const onMove = () => {
    if (idleTimeout) { clearTimeout(idleTimeout); }

    isIdle = false;
    idleTimeout = setTimeout(() => isIdle = true, idleDelay);
  };

  onDestroy(() => {
    if (exitTimeout) { clearTimeout(exitTimeout); }
    if (idleTimeout) { clearTimeout(idleTimeout); }
  });
</script>

<div class="hoverable"
     class:idle={enabled && isIdle}
     on:mouseenter={enabled && onEnter}
     on:mouseleave={enabled && onLeave}
     on:mousemove={enabled && onMove}>

  <slot></slot>
</div>

<style>
  .idle {
    cursor: none;
  }
</style>
