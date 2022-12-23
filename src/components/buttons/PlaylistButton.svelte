<script>
  import BurgerMenu from "../svg_icons/BurgerMenu.svelte";

  export let scale = 1;
</script>

<div class="playlist-button">
  <BurgerMenu scale={scale} />
</div>

<style>
  .playlist-button {
    display: flex;
    cursor: pointer;
  }
</style>
