# Standalone Connector widget

A lightweight link that invites readers to add a publisher's content to an AI
assistant. It uses the approved generic, Claude, ChatGPT, or Grok design without
loading the BeyondWords player, Svelte, ElevenLabs, analytics, or an API client.
Styles and vector icons are bundled into the script; no extra CSS or font
download is needed. If the embedding page already loads Inter, the widget uses
it; otherwise it uses a system font.

Buttons have a 38px minimum height, increased to 44px on coarse-pointer devices
such as touch screens, with 17px decorative icons. Labels use 500-weight, 13.5px
text and cap-height trimming where the browser supports `text-box`; other
browsers retain normal flex centering. Longer labels wrap and can increase the
button height, retaining 8px of padding above and below the label.

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
| `provider` | `"claude"`, `"chatgpt"`, or `"grok"`. Omit for the generic AI-assistant design. Affects branding only. | Generic |
| `label` | Plain-text replacement label. An empty string restores the provider default. | “Add to AI assistant”, “Add to Claude”, “Add to ChatGPT”, or “Add to Grok” |
| `theme` | `"light"`, `"dark"`, or `"auto"`. Auto follows live system preferences. | `"auto"` |

The widget opens `connectUrl` as a normal link in the current tab. It does not
append a provider path, derive a custom domain, perform redirects itself,
contact Myna, or invoke an assistant's deep link. The embedding application
supplies the complete URL, whether it is our hosted page or the publisher's own
page. No project ID is required.

## Static SVG badges

The build also emits twelve self-contained badges under `dist/connector-badges/`:
`generic`, `claude`, `chatgpt`, and `grok`, each in `light`, `dark`, and `auto`.
They contain no scripts or external resources. Wrap an image in an ordinary link:

```html
<a href="https://publisher.example/connect/grok"
   style="display:inline-flex;align-items:center;min-height:44px">
  <img src="https://YOUR-ASSET-HOST/connector-badges/grok-auto.svg"
       alt="Add to Grok" width="130" height="38">
</a>
```

After release, the versioned asset path is
`https://proxy.beyondwords.io/npm/@beyondwords/player@VERSION/dist/connector-badges/grok-auto.svg`.
Badges are 38px high. Their widths are 178px (generic), 145px (Claude), 157px
(ChatGPT), and 130px (Grok). Keep the surrounding link at least 44px high on touch
screens and retain its keyboard-focus styling. The `alt` provides the link name.
Auto follows the reader’s system theme where SVG media queries are supported,
with Light as its fallback. Some email clients reject SVG; use an ordinary text
link there. Custom wording and wrapped labels use the script widget instead.

The Grok artwork and badges include the [Lobe Icons license](third-party-notices.md).

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
source maps, declarations under `dist/types`, and SVGs under `dist/connector-badges`. It does not clear existing
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

Myna hosts the connection pages. Dashboard snippets should use an active custom
domain directly (`https://CUSTOM-DOMAIN/connect[/PROVIDER]`), otherwise the shared
project page (`https://MCP-HOST/v1/projects/PROJECT-ID/connect[/PROVIDER]`). These
are webpage URLs, not the MCP transport URL itself. The widget does not resolve
domains or enforce subscriber access; Myna and the assistant handle that flow.
No backend changes are required for this package.

## Release order

1. Finish review and get green CI on this change and its player base branch.
2. Publish a new player package version through the normal GitHub release workflow.
   Never republish the existing version. Confirm the CDN serves `connector.js`,
   `connector.mjs`, and all twelve `connector-badges/*.svg` files.
3. Deploy the dashboard embed generator only after those assets are available.
   Its generated snippets use the player package's `@latest` CDN path. A text
   link does not need the package assets, but script widgets and SVG badges do.
4. Check a real project on the target environment: hosted URL, active custom
   domain, provider-specific pages, and subscriber sign-in from the assistant.
   Completing account consent requires the account owner's approval.

Standalone widgets do not depend on the in-player Connector layout or saved
player settings. Those are separate follow-up work.
