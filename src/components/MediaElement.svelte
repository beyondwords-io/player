<script>
  import { onMount } from "svelte";

  export let showUserInterface;
  export let interfaceStyle;
  export let userInterface;
  export let showWidgetAtBottom;
  export let widgetStyle;
  export let widgetInterface;
  export let posterImage;

  let bounds, opacity;

  const interfaceShowingVideo = () => {
    if (showWidgetAtBottom && widgetStyle === "video") { return widgetInterface; }
    if (showUserInterface && interfaceStyle === "video") { return userInterface; }
  };

  const updateBounds = () => {
    const videoInterface = interfaceShowingVideo();
    const placeholder = videoInterface?.videoPlaceholder;

    if (placeholder) {
      const userInterfaceStyle = getComputedStyle(placeholder.closest(".user-interface"));

      bounds = placeholder.getBoundingClientRect();
      opacity = parseFloat(userInterfaceStyle.opacity);

      requestAnimationFrame(updateBounds);
    } else {
      bounds = null;
    }

    toggleClass(userInterface, videoInterface);
    toggleClass(widgetInterface, videoInterface);
  };

  const toggleClass = (someInterface, videoInterface) => {
    const placeholder = someInterface?.videoPlaceholder;
    if (!placeholder) { return; }

    const addOrRemove = someInterface === videoInterface ? "add" : "remove";
    placeholder.classList[addOrRemove]("showing-video");
  }

  $: showUserInterface, interfaceStyle, userInterface, showWidgetAtBottom, widgetStyle, widgetInterface, updateBounds();

  onMount(() => {
    const listener = addEventListener("scroll", updateBounds);
    return () => removeEventListener("scroll", listener);
  });

  $: display = bounds ? "block" : "none";
  $: width = bounds ? `${bounds.width}px` : 0;
  $: height = bounds ? `${bounds.height}px` : 0;

  $: isWidget = showWidgetAtBottom && widgetStyle === "video";
  $: position = isWidget && opacity === 1 ? "fixed" : "absolute";

  $: left = bounds && isWidget ? `${bounds.left}px` : "auto";
  $: top = bounds && isWidget && position === "absolute" ? `${bounds.top + window.scrollY}px` : "auto";
  $: bottom = bounds && isWidget && position === "fixed" ? "1rem" : "auto";
</script>

<div class="media-element" style="display: {display}; width: {width}; height: {height}; position: {position}; left: {left}; top: {top}; bottom: {bottom}; opacity: {opacity}">
  <video poster={posterImage} width="100%" height="100%">
    <track kind="captions">
  </video>
</div>

<style>
  .media-element {
    align-items: center;
    justify-content: center;
    background: black;
    overflow: hidden;
    border-radius: 0.5rem;
  }
</style>
