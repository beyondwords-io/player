<script>
  import UserInterface from "./UserInterface.svelte";

  export let showUserInterface;
  export let userInterface;
</script>

{#if showUserInterface}
  <UserInterface bind:this={userInterface} />
{/if}
