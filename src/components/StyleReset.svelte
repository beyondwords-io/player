<style>
  :global(.beyondwords-player :not(svg *)) {
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

  :global(.beyondwords-player button) {
    background: rgb(239, 239, 239); /* TODO: remove after changing video progress bar */
  }

  :global(.beyondwords-player button),
  :global(.beyondwords-player a),
  :global(.beyondwords-player button *),
  :global(.beyondwords-player a *) {
    cursor: pointer;
  }
</style>
