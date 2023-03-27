<script>
  import newEvent from "../../helpers/newEvent";

  export let href;
  export let scale = 1;
  export let playerStyle;
  export let controlsOrder;
  export let largeImage;
  export let onEvent = () => {};

  $: text = href && new URL(href).hostname;

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedAdvertLink",
      description: "The advert link was pressed to open the click-through URL in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

<a class="advert-link {playerStyle} {controlsOrder}" href={href} class:no-image={!largeImage} target="_blank" rel="noreferrer" style="font-size: {12 * scale}px" on:click={handleClick}>
  {text || ""}
</a>

<style>
  a.advert-link {
    font-weight: 500;
    text-decoration: none;
    color: #00cdbc;
    border-bottom: 1px solid #00cdbc;
    white-space: nowrap;
  }

  .small {
    position: absolute;
    top: 4px;
    left: 44px;
  }

  .large {
    position: absolute;
    left: 96px;
    top: 8px;
  }

  .large.no-image {
    left: auto;
  }

  .screen {
    position: absolute;
    top: 236px;
  }

  a.video {
    margin-left: auto;
    margin-right: 0;
    color: rgba(250, 250, 250, 0.8);
    border-color: rgba(250, 250, 250, 0.8);
  }

  a.video.right-to-left {
    margin-left: 0;
    margin-right: auto;
  }
</style>
