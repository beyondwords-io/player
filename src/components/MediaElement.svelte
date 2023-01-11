<script>
  export let showUserInterface;
  export let interfaceStyle;
  export let showWidgetAtBottom;
  export let widgetStyle;
  export let widgetPosition;
  export let widgetWidth;
  export let posterImage;

  $: showBehindWidget = showWidgetAtBottom && widgetStyle === "video";
  $: showBehindStatic = showUserInterface && interfaceStyle === "video" && !showBehindWidget;

  $: position = showBehindWidget && widgetPosition !== "auto" ? `fixed-${widgetPosition}` : "";
  $: style = showBehindWidget && widgetWidth !== "auto" ? `width: ${widgetWidth}` : "";
</script>

<div class="media-element {position}" class:behind-static={showBehindStatic} class:behind-widget={showBehindWidget} {style}>
  <video poster={posterImage} width="100%" height="100%" autoplay loop muted>
    <source src="sample.mp4">
    <track kind="captions">
  </video>
</div>

<style>
  :global(.beyondwords-player) {
    position: relative;
  }

  .media-element {
    display: none;
    align-items: center;
    justify-content: center;
    background: black;
    border-radius: 0.5rem;
    overflow: hidden;
    min-width: 360px;
    max-width: 720px;
  }

  .behind-static {
    display: flex;
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .behind-widget {
    display: flex;
    position: fixed;
    width: 0;
    bottom: 0;
    right: 0;
    margin: 1rem;
    animation: fly-widget 0.33s forwards;
    opacity: 0;
  }

  .fixed-left {
    right: auto;
    left: 0;
  }

  .fixed-center {
    left: 0;
    margin-left: auto;
    margin-right: auto;
  }

  @keyframes fly-widget {
    from { bottom: -100px; opacity: 0; }
    to { bottom: 0; opacity: 1; }
  }
</style>
