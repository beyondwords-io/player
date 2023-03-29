<script>
  import BurgerMenu from "../svg_icons/BurgerMenu.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";

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

<button type="button" class="playlist-button" on:click={handleClick} on:mouseup={blurElement} style="outline-offset: {6.4 * scale}px">
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

  @media (hover: hover) and (pointer: fine) {
    .playlist-button:hover {
      opacity: 0.7;
    }
  }
</style>
