# Connector widget

Standalone generic, Claude, and ChatGPT widgets for S-9077.

- `index.ts`: side-effect-free module API (`Connector`, `createConnectorWidget`, and types).
- `browser.ts`: classic-script registration at `BeyondWords.Connector`.
- `widget.css` / `icons.ts`: self-contained styles and SVG artwork.

See [Embedding a Connector widget](../../doc/connector-widget.md) for the public
contract, build commands, embed examples, and tests. `./bin/build_connector`
builds this entry point independently; `./bin/build` includes it in the normal
package release. Nothing is published until the normal release process runs.
