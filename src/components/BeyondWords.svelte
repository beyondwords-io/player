<script>
  import Logo from "./icons/Logo.svelte";

  export let margin;
  export let marginSide;
</script>

<a href="https://beyondwords.io/" target="_blank" rel="noreferrer" style="margin-{marginSide}: {margin}rem">
  <Logo />
</a>

<style>
  a {
    display: flex;
  }
</style>
