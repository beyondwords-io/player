<script>
  import deriveTokens from "../../helpers/default_theme/deriveTokens";
  import explicitOverrides from "../../helpers/default_theme/explicitOverrides";

  // Boot skeleton: same geometry as the loaded bar, no spinner. It takes the
  // theme so a dark or custom player doesn't flash a light bar before load.
  export let showChatBlock = true;
  export let theme = "light";
  export let radius = 8;
  export let backgroundColor = undefined;
  export let textColor = undefined;

  $: tokens = deriveTokens({ theme, radius, overrides: explicitOverrides({ backgroundColor, textColor }) });
</script>

<div class="skeleton-bar" style="background: {tokens.background}; border-radius: {tokens.radius.bar}">
  <span class="circle" style="background: {tokens.skeleton}"></span>
  <span class="lines">
    <span class="line title" style="background: {tokens.skeleton}"></span>
    <span class="line sub" style="background: {tokens.skeleton}"></span>
  </span>
  {#if showChatBlock}
    <span class="chat-block" style="background: {tokens.skeleton}; border-radius: {tokens.radius.control}"></span>
  {/if}
</div>

<style>
  .skeleton-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 56px;
    padding: 0 8px;
    box-sizing: border-box;
    animation: pulse 1.8s ease-in-out infinite;
  }

  .circle {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 9999px;
  }

  .lines {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .line {
    display: block;
    border-radius: 6px;
  }

  .line.title {
    width: 140px;
    max-width: 60%;
    height: 12px;
  }

  .line.sub {
    width: 88px;
    max-width: 40%;
    height: 8px;
    border-radius: 4px;
  }

  .chat-block {
    width: 88px;
    height: 28px;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton-bar {
      animation: none;
    }
  }
</style>
