<script>
  import UserInterface from "./UserInterface.svelte";

  export let showUserInterface = false;
  export let userInterface = undefined;
</script>

{#if showUserInterface}
  <UserInterface bind:this={userInterface} />
{/if}
