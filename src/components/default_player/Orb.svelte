<script>
  // The agent's mark. It only ever breathes - 3.4s at rest, 1.6s while
  // generating - and holds still under reduced motion.
  export let size = 22;
  export let orb = "linear-gradient(100deg, #943bfc, #e23ad0)";
  export let avatarUrl = undefined;
  export let generating = false;
  export let dimmed = false;
</script>

<span
  class="orb"
  class:generating
  class:dimmed
  class:animating={!dimmed}
  style="width: {size}px; height: {size}px; background: {avatarUrl ? "none" : orb}"
>
  {#if avatarUrl}
    <img src={avatarUrl} alt="" />
  {/if}
</span>

<style>
  /* The animating class is what keeps this alive: StyleReset's all: initial is
     !important, and an important declaration beats a keyframe animation, so an
     element inside the player cannot animate unless it is exempt. Everything the
     reset would have given it is declared here instead. */
  .orb {
    display: block;
    flex-shrink: 0;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 9999px;
    overflow: hidden;
    animation: breathe 3.4s ease-in-out infinite;
  }

  .orb.generating {
    animation-duration: 1.6s;
  }

  .orb.dimmed {
    opacity: 0.35;
    filter: saturate(0.4);
    animation: none;
  }

  .orb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 9999px;
  }

  /* Resting at its own size, so a paused frame is the natural one. */
  @keyframes breathe {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }

    50% {
      transform: scale(1.07);
      opacity: 0.9;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orb {
      animation: none;
    }
  }
</style>
