<script>
  export let title;
  export let playerStyle;
  export let scale = 1;
  export let visible = true;
  export let collapsible = false;
  export let collapsed = false;
  export let color = "#111";

  let element;

  $: width = collapsed ? 0 : collapsible && element ? `${element.scrollWidth}px` : "auto";
  $: style = `font-size: ${12 * scale}px; visibility: ${visible ? "visible" : "hidden"}; width: ${width}; opacity: ${collapsed ? 0 : 1}; color: ${color}`;
</script>

<div class="player-title {playerStyle}" {style} bind:this={element}>
  {@html title?.replaceAll(/<[^>]+>/gi, "") || ""}
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
    height: 15px;
    margin-bottom: 5px;
  }

  .standard,
  .small {
    flex-grow: 1;
    height: 32px;
    display: flex;
  }

  .screen {
    height: 30px;
    position: relative;
    bottom: 20px;
  }

  .video {
    display: none;
  }
</style>
