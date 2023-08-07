[< back to README](https://github.com/BeyondWords-io/player#readme)

## Building your own UI

The player can be used in 'headless' mode if you want to build your own user-interface on top of it.

If the player is initialized without a target, the UI will be disabled and it will be mounted at the end of the `<body>` tag.

Alternatively, you can set `showUserInterface: false` when initializing the player to disable the UI:

```javascript
new BeyondWords.Player({
  projectId: <ID>,
  contentId: '<ID>',
  target: "#my-div",
  showUserInterface: false,
});
```

Note that the player will always be mounted in the DOM, even when you are using headless mode.

This is because the player is built on top of a native media element (a `<video>` tag).

If `playerStyle: "video", showUserInterface: false` is set then the `<video>` tag will show without any controls.

## How to build a UI

The simplest way to build your own UI is to repeatedly query the player instance and re-render.

For example, you can get `player.playbackState` and `player.currentTime` then update your UI accordingly.

More complex features like progress bars can be built using this technique.

The simplest way to repeatedly query the player is by registering an event listener for all events:

```javascript
player.addEventListener("<any>", rerenderCustomUserInterface);

const rerenderCustomUserInterface = () => {
  // Update your user-interface by querying the player object.
};
```

Your function will then be called whenever anything changes in the player, such as the currentTime being updated.

See [Listening to Events](./listening-to-events.md) and [Player Events](./player-events.md) for more information.

## Using React

If you're using React, here's how you might implement the above technique in a component:

```javascript
import { useEffect, useState } from "react";

const CustomUserInterface = ({ player }) => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const listener = player.addEventListener("<any>", () => setCounter(i => i + 1));
    return () => player.removeEventListener("<any>", listener);
  }, []);

  return (
    <span>Current time: {player.currentTime}</span>
    <button onClick={() => player.playbackState = "playing"}>Play</button>
  );
};
```

In this example, the component is forced to re-render when the counter is updated.

Note that the counter isn't actually displayed, we are just using it to force the component to rerender.

## Using WordPress

If you're using our WordPress plugin, it supports a 'headless' mode which hides the default UI.

This feature is only available in private beta versions 4.x or greater. Please [contact us](mailto:support@beyondwords.io) for access.

The player script tag will be added for you when using the WordPress plugin so **do not** add it manually.

WordPress supports a filter called `beyondwords_player_script_onload` which can be used to initialize your UI:

```php
function my_beyondwords_player_script_onload( $onload, $params ) {
    return $onload . 'initializeCustomUserInterface();';
}
add_filter( 'beyondwords_player_script_onload', 'my_beyondwords_player_script_onload', 10, 2 );
```

Then follow the instructions for the plain JavaScript example below to render your custom UI.

## Using JavaScript

If you're using plain Javascript, here's a working example that implements the above technique.

The user-interface in this example is very simple but should demonstrate the core technique.

Note that you will need to replace projectId and contentId with valid identifiers from your project.

If you're using the WordPress plugin (see above) then you can remove the line containing `new BeyondWords.Player(...)`.

```html
<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset='UTF-8' />
    <title>Custom User Interface</title>
  </head>
  <body>
    <div>
      <button id='play-button'>Play</button>
      <span id='content-title'>Loading...</span>
      <span id='time-indicator'>0:00</span>
    </div>

    <script>
      var player, playButton, contentTitle, timeIndicator;

      function initializeCustomUserInterface() {
        player = BeyondWords.Player.instances()[0];
        player = player || new BeyondWords.Player({ projectId: <ID>, contentId: '<ID>' });

        playButton = document.getElementById('play-button');
        contentTitle = document.getElementById('content-title');
        timeIndicator = document.getElementById('time-indicator');

        player.addEventListener('<any>', rerenderCustomUserInterface);
        playButton.addEventListener('click', playOrPause);
      }

      function rerenderCustomUserInterface() {
        var contentItem = player.content[player.contentIndex];
        var isPlaying = player.playbackState === 'playing';

        var minutes = Math.floor(player.currentTime / 60);
        var seconds = Math.floor(player.currentTime % 60);

        playButton.innerText = isPlaying ? 'Pause' : 'Play';
        contentTitle.innerText = contentItem ? contentItem.title : '';
        timeIndicator.innerText = minutes + ":" + seconds.toString().padStart(2, '0');
      }

      function playOrPause() {
        if (player.playbackState === 'playing') {
          player.playbackState = 'paused';
        } else {
          player.playbackState = 'playing';
        }
      };
    </script>

    <!-- Remove this script tag if you are using the WordPress plugin. It will be added for you. -->
    <script async deref
      src='https://proxy.beyondwords.io/npm/@beyondwords/player@latest/dist/umd.js'
      onload='initializeCustomUserInterface()'>
    </script>
  </body>
</html>
```

## Style overrides

Instead of building a completely custom user-interface, you might just want to tweak the player styles.

For example, if you don't want the rounded corners, you could add a CSS rule to your site to remove them:

```css
.beyondwords-player .main {
  border-radius: 0;
}
```

However, this technique **will not work** because the player styles are extremely defensive against accidental overrides.

To intentionally change the player styles, you must use this very long selector that contains 15 classes:

```css
.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp.bwp .main {
  border-radius: 0 !important;
}
```

This will ensure that your style selectors have a higher specificity than those that are built into the player.

Please note that the player styles might change in the future which could mean your overrides stop working.

Because of this, we'd discourage this technique, but you're welcome to use it if you are prepared to monitor this yourself.

## Segment style overrides

If you want to override the highlight color of segments, you can use the following CSS:

```css
[data-beyondwords-marker]:nth-child(3n) .beyondwords-highlight {
  background: #fcc !important;
}

[data-beyondwords-marker]:nth-child(3n+1) .beyondwords-highlight {
  background: #cfc !important;
}

[data-beyondwords-marker]:nth-child(3n+2) .beyondwords-highlight {
  background: #ccf !important;
}
```

Note that you do not need to use the `.bwp.bwp.bwp...` selector in this case
because that is only needed for the player user interface and for the segment
widget.

## Direct API calls

We'd strongly recommend using one of techniques above if you want to customize the user-interface of the player.

However, if you don't want to use any existing player code yourself and instead want direct access to the data then you can use [our APIs](https://api.beyondwords.io/docs).

Currently, all of the data for the player comes from the /player endpoint which is public and cached for five minutes. You could call this yourself and build your own user-interface on top of this data.

However, please keep in mind that you will lose out on many key features of the player, such as BeyondWords Analytics, support for Google Analytics, support for adverts, [Segments Playback](./segments-playback.md), Media Session API support, etc.

[< back to README](https://github.com/BeyondWords-io/player#readme)
