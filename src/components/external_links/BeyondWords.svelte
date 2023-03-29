<script>
  import Logo from "../svg_icons/Logo.svelte";
  import newEvent from "../../helpers/newEvent";

  export let scale = 1;
  export let visible = true;
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedBeyondWords",
      description: "The BeyondWords logo was pressed to open the BeyondWords website in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

<a class="beyondwords" href="https://beyondwords.io/" target="_blank" rel="noreferrer" on:click={handleClick} class:visible style="outline-offset: {6.4 * scale}px">
  <Logo {scale} />
</a>

<style>
  .beyondwords {
    display: flex;
    transition: opacity 0.5s;
    opacity: 0;
  }

  .visible {
    opacity: 1;
  }

  @media (hover: hover) and (pointer: fine) {
    .beyondwords:hover {
      opacity: 0.8;
      transition: none;
    }
  }
</style>
