<script>
  import { onMount } from "svelte";

  let element;

  export let relativeY = undefined;
  export let absoluteY = undefined;
  export let isVisible = undefined;
  export let onChange = undefined;

  const callback = ([entry]) => {
    relativeY = entry.boundingClientRect.y;
    absoluteY = relativeY + window.scrollY;

    if (isVisible === entry.isIntersecting) { return; }

    isVisible = entry.isIntersecting;
    onChange();
  };

  onMount(() => {
    if (!onChange || typeof IntersectionObserver === "undefined") { return; }

    const observer = new IntersectionObserver(callback, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.unobserve(element);
  });
</script>

<div class="visibility" bind:this={element}>
  <slot></slot>
</div>

<style>
  .visibility {
    display: flex;
  }
</style>
