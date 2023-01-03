<script>
  export let title;
  export let interfaceStyle;
  export let scale = 1;
  export let visible = true;
  export let collapsed = false;

  let element;
  let initialWidth;

  setTimeout(() => initialWidth = element.getBoundingClientRect().width, 0);

  $: visibility = visible ? "visible" : "hidden";
  $: width = !initialWidth ? "auto" : collapsed ? 0 : `${initialWidth}px`;
  $: opacity = collapsed ? 0 : 1;

  $: style = `font-size: ${0.75 * scale}rem; visibility: ${visibility}; width: ${width}; opacity: ${opacity}`;
</script>

<div class="player-title {interfaceStyle}" {style} bind:this={element}>
  {title}
</div>

<style>
  .player-title {
    font-weight: 500;
    line-height: 1.25;

    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;

    transition: width 0.5s, opacity 0.25s;
  }

  .large {
    height: 0.9375rem;
    margin-bottom: 0.3125rem;
  }

  .standard,
  .small {
    flex-grow: 1;
    height: 2rem;
    display: flex;
  }

  .screen {
    height: 1.875rem;
    position: relative;
    bottom: 1.25rem;
  }

  .video {
    display: none;
  }
</style>
