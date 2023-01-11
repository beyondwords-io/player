<script>
  import BurgerMenu from "../svg_icons/BurgerMenu.svelte";
  import newEvent from "../../helpers/newEvent";

  export let scale = 1;
  export let color = "#323232";
  export let onEvent = () => {};

  const handleClick = () => {
    onEvent(newEvent({
      type: "PressedTogglePlaylist",
      description: "The toggle playlist button was pressed.",
      initiatedBy: "user",
    }));
  };
</script>

<button class="playlist-button" on:click={handleClick}>
  <BurgerMenu {scale} {color} />
</button>

<style>
  .playlist-button {
    display: flex;
    cursor: pointer;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }
</style>
