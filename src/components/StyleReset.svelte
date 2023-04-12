<style>
  :global(.beyondwords-player :not(svg *, iframe, .animating)),
  :global(.beyondwords-segment-ui :not(svg *, iframe, .animating)) {
    all: initial;
  }

  :global(.beyondwords-player :focus-visible),
  :global(.beyondwords-segment-ui :focus-visible) {
    outline: 1px dotted blue;
    outline: 5px auto -webkit-focus-ring-color;
  }

  :global(.beyondwords-player svg),
  :global(.beyondwords-segment-ui svg) {
    fill: transparent;
  }

  :global(.beyondwords-player div),
  :global(.beyondwords-segment-ui div) {
    display: block;
  }

  :global(.beyondwords-player button),
  :global(.beyondwords-player button *),
  :global(.beyondwords-player a),
  :global(.beyondwords-player a *),
  :global(.beyondwords-segment-ui button),
  :global(.beyondwords-segment-ui button *),
  :global(.beyondwords-segment-ui a),
  :global(.beyondwords-segment-ui a *) {
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
</style>
