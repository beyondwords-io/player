<script>
  import { onMount } from "svelte";

  export let root = undefined;
  export let prepend = false;

  let element;
  let originalParent;

  onMount(() => originalParent = element.parentNode);

  const prependChild = (node, child) => node.insertBefore(child, node.firstChild);
  const appendChild = (node, child) => node.appendChild(child);

  $: newRoot = typeof root !== "string" && root || originalParent;
  $: newRoot && element && (prepend ? prependChild : appendChild)(newRoot, element);

  // Ensure the styles apply when widgetTarget is set.
  $: root?.classList?.add("beyondwords-widget", "bwp");
</script>

<div bind:this={element} class="external-widget" style={root ? "position: relative": ""}>
  <slot></slot>
</div>

<style>
  :global(.beyondwords-widget.position-11-oclock > *) { margin-left: 3px; margin-bottom: 10px }
  :global(.beyondwords-widget.position-12-oclock > *) { margin: auto; margin-bottom: 10px; width: fit-content }
  :global(.beyondwords-widget.position-1-oclock > *) { margin-left: auto; margin-bottom: 10px; width: fit-content }

  :global(.beyondwords-widget.position-2-oclock) { position: absolute; right: -55px; top: 0 }
  :global(.beyondwords-widget.position-3-oclock) { position: absolute; right: -55px; top: 50%; transform: translateY(-50%); }
  :global(.beyondwords-widget.position-4-oclock) { position: absolute; right: -55px; bottom: 0 }

  :global(.beyondwords-widget.position-5-oclock > *) { margin-left: auto; margin-top: 10px; width: fit-content }
  :global(.beyondwords-widget.position-6-oclock > *) { margin: auto; margin-top: 10px; width: fit-content }
  :global(.beyondwords-widget.position-7-oclock > *) { margin-left: 3px; margin-top: 10px }

  :global(.beyondwords-widget.position-8-oclock) { position: absolute; left: -55px; bottom: 0 }
  :global(.beyondwords-widget.position-9-oclock) { position: absolute; left: -55px; top: 50%; transform: translateY(-50%); }
  :global(.beyondwords-widget.position-10-oclock) { position: absolute; left: -55px; top: 0 }

  :global(.beyondwords-widget.position-7-oclock.for-small-player > *),
  :global(.beyondwords-widget.position-11-oclock.for-small-player > *) { margin-left: 0 }

  :global(.beyondwords-widget.position-7-oclock.for-large-player > *),
  :global(.beyondwords-widget.position-11-oclock.for-large-player > *) { margin-left: 7px }

  :global(.beyondwords-widget.position-7-oclock.for-video-player > *),
  :global(.beyondwords-widget.position-11-oclock.for-video-player > *) { margin-left: 15px }
</style>
