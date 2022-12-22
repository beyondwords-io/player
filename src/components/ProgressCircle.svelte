<script>
  export let progress = 0;
  export let scale = 1;
  export let color = "#323232";
  export let enabled = true;

  $: strokeWidth = 2.5 * scale;

  $: radius = 20 * scale + strokeWidth;
  $: size = 2 * radius + strokeWidth;

  $: circumference = radius * 2 * Math.PI;
  $: clamped = Math.max(0, Math.min(1, progress));
  $: dashOffset = circumference * (1 - clamped);
</script>

{#if enabled}
  <div class="progress-circle" style="width: {scale * 40}px; height: {scale * 40}px">
    <svg fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50%"
              cy="50%"
              r={radius}
              stroke={color}
              stroke-width={strokeWidth}
              stroke-dasharray="{circumference} {circumference}"
              stroke-dashoffset={dashOffset} />
    </svg>

    <slot></slot>
  </div>
{:else}
  <slot></slot>
{/if}

<style>
  .progress-circle {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .progress-circle svg {
    position: absolute;
    transform: rotate(-90deg);
    transform-origin: 50% 50%,
  }
</style>
