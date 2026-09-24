# Standalone Connector widget

A lightweight link that invites readers to add a publisher's content to an AI
assistant. It uses the approved generic, Claude, or ChatGPT design without
loading the BeyondWords player, Svelte, ElevenLabs, analytics, or an API client.
Styles and vector icons are bundled into the script; no extra CSS or font
download is needed. If the embedding page already loads Inter, the widget uses
it; otherwise it uses a system font.

Buttons have a 38px minimum height, increased to 44px on coarse-pointer devices
such as touch screens, with 17px decorative icons. Labels use 500-weight, 13.5px
text and cap-height trimming where the browser supports `text-box`; other
browsers retain normal flex centering. Longer labels wrap and can increase the
button height.

**Release status:** these files are built locally on the S-9077 branch. They are
not on npm or the CDN yet. Publishing still uses the repository's normal release
process; this work does not publish a release.

## Plain script embed

```html
<div id="connector"></div>
<script src="https://YOUR-ASSET-HOST/connector.js"></script>
<script>
  const connector = new BeyondWords.Connector({
    target: "#connector",
    connectUrl: "https://publisher.example/connect/claude",
    provider: "claude",
    theme: "auto"
  });
</script>
```

Replace the script URL with the location hosting `dist/connector.js`. Once a
release containing this feature has been published, its versioned CDN URL is:

```text
https://proxy.beyondwords.io/npm/@beyondwords/player@VERSION/dist/connector.js
```

Replace `VERSION` with a released version that includes the widget. Do not use
the currently published player version until it includes these files.

Place the target before initialization and wait for the script to load. The
ordered script tags above do this automatically. If you use `async` or `defer`,
initialize from the script's load callback or your own initialization module
after both the script and the target are ready. Load the script once, then
create as many widget instances as needed. Loading it again will not overwrite
an existing `BeyondWords.Connector` or `BeyondWords.Player`.

## Module / TypeScript usage

After publishing the package version containing this feature:

```ts
import { Connector } from "@beyondwords/player/connector";
import type { ConnectorWidgetOptions } from "@beyondwords/player/connector";

const options: ConnectorWidgetOptions = {
  target: document.getElementById("connector")!,
  connectUrl: "https://publisher.example/choose-an-assistant",
};

const connector = new Connector(options);
```

This subpath imports only `dist/connector.mjs`, not the main player bundle. It
does not register browser globals. Importing the module during server rendering
is safe, but instantiate it only after mounting in the browser. This entry point
is ESM-only; use the plain script embed for environments without an ESM bundler.
The function API `createConnectorWidget(options)` is also exported.

## Options

| Option | Meaning | Default |
| --- | --- | --- |
| `target` | Mounting HTMLElement or a selector matching one. Existing children are preserved. | Required |
| `connectUrl` | Complete `http://` or `https://` webpage URL, used as supplied. | Required |
| `provider` | `"claude"` or `"chatgpt"`. Omit for the generic AI-assistant design. Affects branding only. | Generic |
| `label` | Plain-text replacement label. An empty string restores the provider default. | “Add to AI assistant”, “Add to Claude”, or “Add to ChatGPT” |
| `theme` | `"light"`, `"dark"`, or `"auto"`. Auto follows live system preferences. | `"auto"` |

The widget opens `connectUrl` as a normal link in the current tab. It does not
append a provider path, derive a custom domain, perform redirects itself,
contact Myna, or invoke an assistant's deep link. The embedding application
supplies the complete URL, whether it is our hosted page or the publisher's own
page. No project ID is required.

## Runtime updates and cleanup

```js
connector.update({ theme: "dark" });
connector.update({ label: "Explore our reporting", provider: "chatgpt" });
connector.update({ connectUrl: "https://publisher.example/my-setup-page" });
connector.update({ provider: undefined, label: undefined, theme: "auto" });

// On page/component unmount:
connector.destroy();
```

Updates are validated before applying: an invalid update leaves the previous
configuration intact. Change the destination explicitly when changing providers
if you want a provider-specific page. `target` cannot be changed through
`update`; destroy and recreate the widget to move it. `element` exposes the
widget's host element. Destroy removes only that element and its system-theme
listener; it can safely be called twice. Updating a destroyed widget throws.

Shadow DOM isolates the widget's styles from publisher CSS. Labels are text,
never HTML. Unsafe URL schemes and relative URLs are rejected. Sites with a
strict Content Security Policy must permit the script and the widget's inline
Shadow DOM stylesheet; the embed does not bypass CSP. Inline initialization in
the example can be moved to the publisher's own permitted script.

## Build and test locally

```sh
./bin/build_connector
./bin/server
```

- [Design preview](http://localhost:8000/connector-preview.html): interactive UI controls; clicks are intercepted.
- [Standalone embed demo](http://localhost:8000/connector-embed.html): ordinary script embed; clicks navigate normally to the local design preview.

The standalone build emits `dist/connector.js`, `dist/connector.mjs`, their
source maps, and declarations under `dist/types`. It does not clear existing
player build files. `./bin/build` also builds the connector after the player, so
the normal npm release contains both, independently loadable bundles.

```sh
npx vitest run test/connector
npx playwright test test/features/connector*.test.ts --project=desktop-chrome
```

Build first: browser tests exercise the actual built scripts and module, not a
development-only import. They also check independent instances, repeat script
loads, coexistence with the player, real link navigation, theme changes, and
the absence of extra runtime network requests. CI runs these after `./bin/build`.

Connection pages, dashboard snippet generation, more provider designs, and
static SVG badge distribution are separate follow-up work. No backend changes
are required for this package.
