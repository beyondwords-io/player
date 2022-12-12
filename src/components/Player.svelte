<script>
  import UserInterface from "./UserInterface.svelte";

  export let showUserInterface;
</script>

{#if showUserInterface}
  <UserInterface />
{/if}
