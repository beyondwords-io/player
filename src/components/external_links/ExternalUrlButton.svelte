<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";
  import newEvent from "../../helpers/newEvent";

  export let href;
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedExternalUrl",
      description: "The external URL button was pressed to open the source article in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

<a class="external-url-button" href={href} target="_blank" rel="noreferrer" on:click={handleClick}>
  <OpenNewTab {scale} {color} circular={false} />
</a>

<style>
  .external-url-button {
    display: flex;
  }

  .external-url-button:hover {
    opacity: 0.8;
  }
</style>
