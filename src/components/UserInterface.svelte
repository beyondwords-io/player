<script>
  import "@fontsource/inter/variable.css";
  import PlayPauseButton from "./PlayPauseButton.svelte";
  import ListenPrompt from "./ListenPrompt.svelte";
  import PlaybackRate from "./PlaybackRate.svelte";
  import Logo from "./icons/Logo.svelte";
  import SkipButtons from "./SkipButtons.svelte";
  import PlaybackTime from "./PlaybackTime.svelte";

  export let style = "standard";
</script>

<div class="beyondwords-player {style}">
  <PlayPauseButton />

  <!--<div class="listen-prompt">
    <ListenPrompt />
  </div>-->
  <div class="controls">
    <PlaybackRate />
    <SkipButtons style="segments" />
    <PlaybackTime />
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
    background: #fafafa;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .listen-prompt {
    margin-left: 0.5rem;
    flex-grow: 1;
  }

  .controls {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .beyondwords-logo {
    display: flex;
    margin-right: 0.6875rem;
  }
</style>
