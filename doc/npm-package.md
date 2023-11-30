[< back to README](https://github.com/BeyondWords-io/player#readme)

## NPM Package

In the [Getting Started](./getting-started.md) guide we saw how to embed the
player using a script tag. However, this might not suit your project if you are
using something like Webpack. This guide explains how to add the player to your
build pipeline.

First, add the player NPM package:

```sh
npm add @beyondwords/player
```

Then, add a div somewhere in your app:

```html
<div id='beyondwords-player'></div>
```

And initialize the player with:

```javascript
import BeyondWords from '@beyondwords/player';

new BeyondWords.Player({ target: '#beyondwords-player', projectID: <ID>, contentId: '<ID>' });
```

After reloading your app, the player should load:

<img src="./images/standard-player.png" width="400px" />

## How it works

The initialization is almost identical to the Getting Started guide except we
set `target: '#beyondwords-player'`.

This instructs the player to initialize inside the DOM node with id='beyondwords-player'.

Note that the DOM node must be on the page when the initializer is called or
the player won't load.

## How to configure it

The preferred way to configure the player is by logging into the BeyondWords
dashboard and changing its settings.

However, you can also override properties in the initializer, for example:

```javascript
new BeyondWords.Player({
  target: '#beyondwords-player',
  projectID: <ID>,
  contentId: '<ID>',
  playerStyle: 'large',
  callToAction: 'Listen to this recipe',
  backgroundColor: 'yellow',
});
```

These settings can also be changed after loading the player by using the [Player SDK](./player-sdk.md).

Please refer to [Player Settings](./player-settings.md) for an explanation of all the settings that can be configured.

[< back to README](https://github.com/BeyondWords-io/player#readme)
