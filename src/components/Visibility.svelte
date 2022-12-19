<script>
  import { onMount } from "svelte";

  let element;
  export let onChange = undefined;

  const callback = ([entry]) => {
    const isVisible = entry.isIntersecting;
    const absoluteY = entry.boundingClientRect.y + window.scrollY;

    onChange(isVisible, absoluteY);
  };

  onMount(() => {
    if (!onChange) { return; }

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
