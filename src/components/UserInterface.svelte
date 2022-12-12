<script>
  import "@fontsource/inter";

  import Play from "./icons/Play.svelte";
  import Pause from "./icons/Pause.svelte";
  import Logo from "./icons/Logo.svelte";

  export let style = "standard";
</script>

<div class="beyondwords-player {style}">
  <div class="play-pause-button">
    <Play />
  </div>

  <div class="listen-prompt">
    <div class="text">Listen to this article</div>
    <div class="duration">4 min</div>
  </div>

  <div class="beyondwords-logo">
    <Logo />
  </div>
</div>

<style>
  .beyondwords-player :global(*) {
    font-family: Inter, Arial, sans-serif;
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
    height: 80%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin-left: 0.5rem;
    flex-grow: 1;
  }

  .listen-prompt .text {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .listen-prompt .duration {
    font-size: 0.625rem;
    font-weight: 300;
  }

  .beyondwords-logo {
    display: flex;
    margin-right: 0.6875rem;
  }
</style>
