<script>
  import { onMount } from "svelte";

  export let root;
  let external;

  onMount(() => {
    root.appendChild(external.firstChild);
    external.remove();
  });
</script>

<div class="external" bind:this={external}>
  <slot></slot>
</div>
