<script>
  import { onMount } from "svelte";

  export let root = undefined;

  let outer, inner;

  onMount(() => inner = outer.firstChild);

  $: target = typeof root === "string" ? null : root;
  $: target && inner && target.appendChild(inner);

  // Ensure the styles apply when widgetTarget is set.
  $: target?.classList?.add("beyondwords-widget", "bwp");
</script>

<div bind:this={outer}>
  <slot></slot>
</div>
