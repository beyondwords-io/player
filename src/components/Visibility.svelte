<script>
  import { onMount } from "svelte";

  let element;

  export let onChange = undefined;
  export let isVisible = undefined;

  export let relativeY = undefined;
  export let absoluteY = undefined;

  const callback = ([entry]) => {
    isVisible = entry.isIntersecting;
    relativeY = entry.boundingClientRect.y;
    absoluteY = relativeY + window.scrollY;

    onChange();
  };

  onMount(() => {
    if (!onChange || typeof IntersectionObserver === "undefined") { return; }

    const observer = new IntersectionObserver(callback, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.unobserve(element);
  });
</script>

<div bind:this={element}>
  <slot></slot>
</div>

<style>
  div {
    display: flex;
  }
</style>
