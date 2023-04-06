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

## How to build a UI

The simplest way to build your own UI is to repeatedly query the player instance and re-render.

For example, you can get `player.playbackState` and `player.currentTime` then update your UI accordingly.

More complex features like progress bars can be built using this technique.

The simplest way to repeatedly query the player is by registering an event listener for all events:

```javascript
player.addEventListener("<any">, rerenderCustomUserInterface);

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

## Using JavaScript

If you're using plain Javascript, here's a working example that implements the above technique.

The user-interface in this example is very simple but should demonstrate the core technique.

Note that you will need to replace projectId and contentId with valid identifiers from your project.

```html
<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset='UTF-8' />
    <title>Custom User Interface</title>
    <script src='https://proxy.beyondwords.io/npm/@beyondwords/player@latest/dist/umd.js'></script>
  </head>
  <body>
    <div>
      <button id='play-button'>Play</button>
      <span id='content-title'>Loading...</span>
      <span id='time-indicator'>0:00</span>
    </div>

    <script>
      let player, playButton, contentTitle, timeIndicator;

      const initialize = () => {
        player = new BeyondWords.Player({ projectId: <ID>, contentId: '<ID>' });

        playButton = document.getElementById('play-button');
        contentTitle = document.getElementById('content-title');
        timeIndicator = document.getElementById('time-indicator');

        player.addEventListener('<any>', rerender);
        playButton.addEventListener('click', playOrPause);
      };

      const rerender = () => {
        const isPlaying = player.playbackState === 'playing';
        const minutes = Math.floor(player.currentTime / 60);
        const seconds = Math.floor(player.currentTime % 60);

        playButton.innerText = isPlaying ? 'Pause' : 'Play';
        contentTitle.innerText = player.content[player.contentIndex]?.title || '';
        timeIndicator.innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };

      const playOrPause = () => {
        if (player.playbackState === 'playing') {
          player.playbackState = 'paused';
        } else {
          player.playbackState = 'playing';
        }
      };

      document.addEventListener('DOMContentLoaded', initialize);
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

## Direct API calls

We'd strongly recommend using one of techniques above if you want to customize the user-interface of the player.

However, if you don't want to use any existing player code yourself and instead want direct access to the data then you can use [our APIs](https://api.beyondwords.io/docs).

Currently, all of the data for the player comes from the /player endpoint which is public and cached for five minutes. You could call this yourself and build your own user-interface on top of this data.

However, please keep in mind that you will lose out on many key features of the player, such as BeyondWords Analytics, Google Analytics, support for adverts, [Segments Playback](./doc/segments-playback.md), Media Session API support, etc.

[< back to README](https://github.com/BeyondWords-io/player#readme)
