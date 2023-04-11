<style>
  :global(.beyondwords-player :not(svg *, iframe, .animating)) {
    all: initial;
  }

  :global(.beyondwords-player :focus-visible) {
    outline: 1px dotted blue;
    outline: 5px auto -webkit-focus-ring-color;
  }

  :global(.beyondwords-player svg) {
    fill: transparent;
  }

  :global(.beyondwords-player div) {
    display: block;
  }

  :global(.beyondwords-player button),
  :global(.beyondwords-player a),
  :global(.beyondwords-player button *),
  :global(.beyondwords-player a *) {
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
