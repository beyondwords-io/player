<script>
  import Logo from "../svg_icons/Logo.svelte";
  import newEvent from "../../helpers/newEvent";

  export let scale = 1;
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedBeyondWords",
      description: "The BeyondWords logo was pressed to open the BeyondWords website in a new tab.",
      initiatedBy: "user",
    }));
  };
</script>

<a class="beyond-words" href="https://beyondwords.io/" target="_blank" rel="noreferrer" on:click={handleClick}>
  <Logo {scale} />
</a>

<style>
  .beyond-words {
    display: flex;
  }
</style>
