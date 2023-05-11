<script>
  import OpenNewTab from "../svg_icons/OpenNewTab.svelte";
  import newEvent from "../../helpers/newEvent";
  import translate from "../../helpers/translate";

  export let href;
  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedSourceUrl",
      description: "The source URL button was pressed to open the source article in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

<a class="source-url-button" href={href} target="_blank" on:click={handleClick} aria-label={translate("visitSourceArticle")}>
  <OpenNewTab {scale} {color} circular={false} />
</a>

<style>
  .source-url-button {
    display: flex;
  }

  @media (hover: hover) and (pointer: fine) {
    .source-url-button:hover {
      opacity: 0.8;
    }
  }
</style>
