<style>
  :global(.beyondwords-player :not(svg *, iframe, .animating)),
  :global(.beyondwords-segment-widget :not(svg *, iframe, .animating)) {
    all: initial;
  }

  :global(.beyondwords-player :focus-visible),
  :global(.beyondwords-segment-widget :focus-visible) {
    outline: 1px dotted blue;
    outline: 5px auto -webkit-focus-ring-color;
  }

  :global(.beyondwords-player svg),
  :global(.beyondwords-segment-widget svg) {
    fill: transparent;
  }

  :global(.beyondwords-player div),
  :global(.beyondwords-segment-widget div) {
    display: block;
  }

  :global(.beyondwords-player button),
  :global(.beyondwords-player button *),
  :global(.beyondwords-player a),
  :global(.beyondwords-player a *),
  :global(.beyondwords-segment-widget button),
  :global(.beyondwords-segment-widget button *),
  :global(.beyondwords-segment-widget a),
  :global(.beyondwords-segment-widget a *) {
    cursor: pointer;
  }

  :global(.beyondwords-highlight) {
    color: inherit;
    margin: 0;
    padding: 0;
  }

  :global(.beyondwords-clickable) {
    cursor: pointer;
  }

  :global(.beyondwords-relative) {
    position: relative;
  }

  :global(.beyondwords-segment-widget) {
    position: relative;
  }
</style>
