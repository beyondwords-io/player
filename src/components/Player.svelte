<script>
  import "@fontsource/inter";

  export let showUserInterface;
</script>

{#if showUserInterface}
  <div class="beyondwords-player">
    <p>showing user interface</p>
  </div>
{/if}

<style>
  .beyondwords-player :global(*) {
    font-family: Inter;
  }
</style>
