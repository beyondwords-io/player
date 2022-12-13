<script>
  import Logo from "./icons/Logo.svelte";

  export let isMobile = false;
</script>

<a href="https://beyondwords.io/" target="_blank" rel="noreferrer" class:mobile={isMobile}>
  <Logo />
</a>

<style>
  a {
    display: flex;
    margin-right: 0.75rem;
  }

  .mobile {
    margin-right: 0;
    margin-left: 0.75rem;
  }
</style>
