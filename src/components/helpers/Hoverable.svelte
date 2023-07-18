<script>
  import { onDestroy } from "svelte";

  export let exitDelay = 0;
  export let idleDelay = Infinity;
  export let isHovering = false;

  let isExit = true;
  let isIdle = true;
  let exitTimeout;
  let idleTimeout;

  $: isHovering = !isExit && !isIdle;

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
     role="none"
     on:mouseenter={onEnter}
     on:mouseleave={onLeave}
     on:mousemove={idleDelay !== Infinity && onMove}>
  <slot></slot>
</div>
