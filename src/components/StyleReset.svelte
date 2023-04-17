<style>
  :global(.beyondwords-player :not(svg *, iframe, .animating)),
  :global(.beyondwords-widget :not(svg *, iframe, .animating)) {
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

  :global(.beyondwords-widget.position-11-oclock > *) { margin-left: 3px; margin-bottom: 10px }
  :global(.beyondwords-widget.position-12-oclock > *) { margin: auto; margin-bottom: 10px }
  :global(.beyondwords-widget.position-1-oclock > *) { margin-left: auto; margin-bottom: 10px }

  :global(.beyondwords-widget.position-2-oclock) { position: absolute; right: -55px; top: 0 }
  :global(.beyondwords-widget.position-3-oclock) { position: absolute; right: -55px; top: 50%; transform: translateY(-50%); }
  :global(.beyondwords-widget.position-4-oclock) { position: absolute; right: -55px; bottom: 0 }

  :global(.beyondwords-widget.position-5-oclock > *) { margin-left: auto; margin-top: 10px }
  :global(.beyondwords-widget.position-6-oclock > *) { margin: auto; margin-top: 10px }
  :global(.beyondwords-widget.position-7-oclock > *) { margin-left: 3px; margin-top: 10px }

  :global(.beyondwords-widget.position-8-oclock) { position: absolute; left: -55px; bottom: 0 }
  :global(.beyondwords-widget.position-9-oclock) { position: absolute; left: -55px; top: 50%; transform: translateY(-50%); }
  :global(.beyondwords-widget.position-10-oclock) { position: absolute; left: -55px; top: 0 }
</style>
