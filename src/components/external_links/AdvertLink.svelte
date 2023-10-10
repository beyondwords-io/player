<script>
  import newEvent from "../../helpers/newEvent";
  import ensureProtocol from "../../helpers/ensureProtocol";
  import chooseAdvertText from "../../helpers/chooseAdvertText";
  import blurElement from "../../helpers/blurElement";

  export let href;
  export let scale = 1;
  export let color = "#323232";
  export let playerStyle;
  export let controlsOrder;
  export let largeImage;
  export let isMobile;
  export let endVisible;
  export let onEvent = () => {};

  $: hrefWithProtocol = ensureProtocol(href);
  $: displayText = chooseAdvertText(hrefWithProtocol);

  $: style = `font-size: ${12 * scale}px; color: ${color}; border-color: ${color}`;

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedAdvertLink",
      description: "The advert link was pressed to open the click-through URL in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

<a class="advert-link {playerStyle} {controlsOrder}" href={hrefWithProtocol} {style} class:no-image={!largeImage} class:no-end={!endVisible} class:mobile={isMobile} target="_blank" on:click={handleClick} on:mouseup={blurElement}>
  {displayText}
</a>

<style>
  a.advert-link {
    font-weight: 500;
    text-decoration: none;
    border-bottom-width: 1px;
    border-bottom-style: solid;
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

  .screen.no-image {
    top: 52px;
  }

  .screen.no-image.mobile {
    top: 100px;
  }

  .screen.no-end {
    top: 140px;
  }

  .screen.no-image.no-end {
    top: 24px;
  }

  a.video {
    margin-left: auto;
    margin-right: 0;
  }

  a.video.right-to-left {
    margin-left: 0;
    margin-right: auto;
  }
</style>
