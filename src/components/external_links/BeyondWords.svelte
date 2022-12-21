<script>
  import Logo from "../svg_icons/Logo.svelte";

  export let scale = 1;
</script>

<a class="beyond-words" href="https://beyondwords.io/" target="_blank" rel="noreferrer">
  <Logo {scale} />
</a>

<style>
  .beyond-words {
    display: flex;
  }
</style>
