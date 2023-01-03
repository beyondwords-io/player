<script>
  import BurgerMenu from "../svg_icons/BurgerMenu.svelte";

  export let scale = 1;
  export let color = "#323232";
</script>

<div class="playlist-button">
  <BurgerMenu {scale} {color} />
</div>

<style>
  .playlist-button {
    display: flex;
    cursor: pointer;
  }
</style>
