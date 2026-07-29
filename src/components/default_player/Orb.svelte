<script>
  // The agent's mark. It only ever breathes - 3.4s at rest, 1.6s while
  // generating - and holds still under reduced motion.
  export let size = 22;
  export let orb = "linear-gradient(100deg, #943bfc, #e23ad0)";
  export let ring = "none";
  export let avatarUrl = undefined;
  export let generating = false;
  export let dimmed = false;
</script>

<span
  class="orb"
  class:generating
  class:dimmed
  style="width: {size}px; height: {size}px; background: {avatarUrl ? "none" : orb}; box-shadow: {ring}"
>
  {#if avatarUrl}
    <img src={avatarUrl} alt="" />
  {/if}
</span>

<style>
  .orb {
    display: block;
    flex-shrink: 0;
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

  @keyframes breathe {
    0%, 100% {
      transform: scale(0.94);
      opacity: 0.85;
    }

    50% {
      transform: scale(1.04);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orb {
      animation: none;
    }
  }
</style>
