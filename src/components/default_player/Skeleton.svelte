<script>
  // Boot skeleton: same geometry as the loaded bar, no spinner.
  export let showChatBlock = true;
</script>

<div class="skeleton-bar">
  <span class="circle"></span>
  <span class="lines">
    <span class="line title"></span>
    <span class="line sub"></span>
  </span>
  {#if showChatBlock}
    <span class="chat-block"></span>
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
    background: #f5f5f5;
    border-radius: 8px;
    animation: pulse 1.8s ease-in-out infinite;
  }

  .circle {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.08);
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
    background: rgba(0, 0, 0, 0.08);
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
    background: rgba(0, 0, 0, 0.06);
  }

  .chat-block {
    width: 88px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.06);
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
