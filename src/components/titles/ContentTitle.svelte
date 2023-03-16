<script>
  export let title;
  export let maxLines = 1;
  export let maxWidth = undefined;

  export let center;
  export let bold = false;
  export let flex = "0 1 auto";
  export let scale = 1;
  export let color = "#111";

  $: fontSize = `${10 * scale}px`;
  $: maxHeight = `${10 * scale * 1.2 * maxLines}px`;
  $: maxWidthCss = maxWidth ? `max-width: ${maxWidth}px` : "";

  $: style = `--n: ${maxLines}; font-size: ${fontSize}; max-height: ${maxHeight}; flex: ${flex}; ${maxWidthCss}; color: ${color}`;
</script>

<div class="content-title" class:bold class:one-line={maxLines === 1} class:center class:n-lines={maxLines > 1} {style}>
  {title || ""}
</div>

<style>
  .content-title {
    font-weight: 300;
    line-height: 1.2;
    text-overflow: ellipsis;
    overflow: hidden;
    min-width: 0;
    max-width: fit-content;
  }

  .one-line {
    white-space: nowrap;
  }

  .n-lines {
    display: -webkit-box;

            line-clamp: var(--n);
    -webkit-line-clamp: var(--n);
    -webkit-box-orient: vertical;
  }

  .bold {
    font-weight: 500;
  }

  .center {
    text-align: center;
  }
</style>
