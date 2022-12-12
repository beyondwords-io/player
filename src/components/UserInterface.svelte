<script>
  import "@fontsource/inter/variable.css";
  import Play from "./icons/Play.svelte";
  import Pause from "./icons/Pause.svelte";
  import Logo from "./icons/Logo.svelte";
  import ListenPrompt from "./ListenPrompt.svelte";

  export let style = "standard";
</script>

<div class="beyondwords-player {style}">
  <div class="play-pause-button">
    <Play />
  </div>

  <div class="listen-prompt">
    <ListenPrompt />
  </div>

  <div class="beyondwords-logo">
    <Logo />
  </div>
</div>


<style>
  .beyondwords-player :global(*) {
    font-family: "InterVariable", sans-serif;
    color: #323232;
  }

  .standard {
    width: 43.75rem;
    height: 3rem;
    padding: 0.25rem;
    box-sizing: border-box;
    border-radius: 1.5625rem;
    background: white;
    display: flex;
    align-items: center;
  }

  .play-pause-button {
    display: flex;
  }

  .listen-prompt {
    margin-left: 0.5rem;
    flex-grow: 1;
  }

  .beyondwords-logo {
    display: flex;
    margin-right: 0.6875rem;
  }
</style>
