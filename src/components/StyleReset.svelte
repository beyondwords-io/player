<style>
  :global(.beyondwords-player :where(:not(svg *, iframe, .animating))),
  :global(.beyondwords-widget :where(:not(svg *, iframe, .animating))) {
    all: initial;
  }

  :global(.beyondwords-player :focus-visible),
  :global(.beyondwords-widget :focus-visible) {
    outline: 1px dotted blue;
    outline: 5px auto -webkit-focus-ring-color;
  }

  :global(.beyondwords-player svg),
  :global(.beyondwords-widget svg) {
    fill: transparent;
  }

  :global(.beyondwords-player div),
  :global(.beyondwords-widget div) {
    display: block;
  }

  :global(.beyondwords-player button),
  :global(.beyondwords-player button *),
  :global(.beyondwords-player a),
  :global(.beyondwords-player a *),
  :global(.beyondwords-widget button),
  :global(.beyondwords-widget button *),
  :global(.beyondwords-widget a),
  :global(.beyondwords-widget a *) {
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
</style>
