<script>
  import { onMount } from "svelte";
  import newEvent from "../../helpers/newEvent";

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

    onChange(newEvent({
      type: "VisibilityChanged",
      description: "The player was scrolled into or out of view.",
      initiatedBy: "user",
      isVisible,
    }));
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
