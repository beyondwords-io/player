<script>
  import Logo from "./icons/Logo.svelte";

  export let marginSide;
</script>

<a href="https://beyondwords.io/" target="_blank" rel="noreferrer" class="{marginSide}-margin">
  <Logo />
</a>

<style>
  a {
    display: flex;
  }

  .left-margin {
    margin-left: 0.75rem;
  }

  .right-margin {
    margin-right: 0.75rem;
  }
</style>
