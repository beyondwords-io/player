<script>
  import { onMount } from "svelte";
  import newEvent from "../../helpers/newEvent";

  let element;

  export let enabled = false;
  export let relativeY = undefined;
  export let absoluteY = undefined;
  export let isVisible = undefined;
  export let onEvent = () => {};

  const callback = ([entry]) => {
    if (!enabled) { return; }

    relativeY = entry.boundingClientRect.y;
    absoluteY = relativeY + window.scrollY;

    if (isVisible === entry.isIntersecting) { return; }
    isVisible = entry.isIntersecting;

    onEvent(newEvent({
      type: "VisibilityChanged",
      description: "The player was scrolled into or out of view.",
      initiatedBy: "user",
      isVisible,
    }));
  };

  onMount(() => {
    if (typeof IntersectionObserver === "undefined") { return; }

    const observer = new IntersectionObserver(callback, { threshold: 0.5 });
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      callback([{ isIntersecting: false, boundingClientRect: { y: Infinity } }]);
    };
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
