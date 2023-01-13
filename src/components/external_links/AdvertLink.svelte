<script>
  import newEvent from "../../helpers/newEvent";

  export let href;
  export let scale = 1;
  export let activeStyle;
  export let controlsOrder;
  export let onEvent = () => {};

  $: text = new URL(href).hostname;

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedAdvertLink",
      description: "The advert link was pressed to open the click-through URL in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

<a class="advert-link {activeStyle} {controlsOrder}" href={href} target="_blank" rel="noreferrer" style="font-size: {0.75 * scale}rem" on:click={handleClick}>
  {text}
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
    top: 0.25rem;
    left: 2.75rem;
  }

  .large {
    position: absolute;
    left: 6rem;
    top: 0.5rem;
  }

  .screen {
    position: absolute;
    top: 14.75rem;
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
