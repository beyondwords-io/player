<script>
  export let speed = 1;
  export let scale = 1;
  export let color = "#323232";

  $: size = `${2.5 * scale}rem`;
  $: fontSize = `${0.75 * scale}rem`;
</script>

<div class="speed-button" style="width: {size}; height: {size}; font-size: {fontSize}; color: {color}">
  {speed}x
</div>

<style>
  .speed-button {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    cursor: pointer;
  }
</style>
