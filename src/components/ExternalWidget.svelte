<script>
  export let root = undefined;

  let element;

  $: target = typeof root === "string" ? null : root;
  $: target && element && target.appendChild(element);

  // Ensure the styles apply when widgetTarget is set.
  $: target?.classList?.add("beyondwords-widget", "bwp");
</script>

<div bind:this={element} class="external-widget">
  <slot></slot>
</div>

<style>
  .external-widget {
    position: relative;
  }

  :global(.beyondwords-widget.position-11-oclock > *) { margin-left: 3px; margin-bottom: 10px }
  :global(.beyondwords-widget.position-12-oclock > *) { margin: auto; margin-bottom: 10px }
  :global(.beyondwords-widget.position-1-oclock > *) { margin-left: auto; margin-bottom: 10px }

  :global(.beyondwords-widget.position-2-oclock) { position: absolute; right: -55px; top: 0 }
  :global(.beyondwords-widget.position-3-oclock) { position: absolute; right: -55px; top: 50%; transform: translateY(-50%); }
  :global(.beyondwords-widget.position-4-oclock) { position: absolute; right: -55px; bottom: 0 }

  :global(.beyondwords-widget.position-5-oclock > *) { margin-left: auto; margin-top: 10px }
  :global(.beyondwords-widget.position-6-oclock > *) { margin: auto; margin-top: 10px }
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
