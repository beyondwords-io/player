<script>
  import OpenNewTab from "./icons/OpenNewTab.svelte";

  export let href;
</script>

<a href={href} target="_blank" rel="noreferrer">
  <OpenNewTab color="#00cdbc" />
</a>

<style>
  a {
    display: flex;
  }
</style>
