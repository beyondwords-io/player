<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";
  import newEvent from "../../helpers/newEvent";

  export let href;
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedNewTab",
      description: "The new tab button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<a class="new-tab-button" href={href} target="_blank" rel="noreferrer" on:click={handleClick}>
  <OpenNewTab {scale} {color} circular={false} />
</a>

<style>
  .new-tab-button {
    display: flex;
  }
</style>
