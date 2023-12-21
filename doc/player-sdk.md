[< back to README](https://github.com/BeyondWords-io/player#readme)

## Player SDK

After the player has loaded, it can be controlled programmatically and its state
can be queried.

The return value of the `new BeyondWords.Player(...)` call is a player instance:

```javascript
const player = new BeyondWords.Player(...);
```

This instance can be used to get the current time, change the track, set the
backgroundColor, etc:

```javascript
console.log(player.currentTime);

player.contentIndex = 3;

player.backgroundColor = "red";
```

The player is reactive and will immediately update with these changes.

## How to get instances

If you have already initialized the player, e.g. via a script tag, you can get
all of the player instances with:

```javascript
BeyondWords.Player.instances() // Returns an array.
```

For example, if you only have one player on your page, you could set its
backgroundColor with:

```javascript
BeyondWords.Player.instances()[0].backgroundColor = "red";
```

For convenience the `BeyondWords` constant is added to the global `window` object.

## How overrides work

There are three different places settings can come from:

1. From the BeyondWords API after setting project and content identifiers
2. From the initialization code, e.g. in the script tag's 'onload' attribute
3. From Player SDK calls made by you after the player has loaded

The override order is shown above.

Firstly, the player will use properties from the API which can be overridden by
the initialization code.

Secondly, the player's properties can be overridden by SDK calls, e.g. to
change its backgroundColor.

If the player's identifiers change and a new API request is made, any temporary
changes made by SDK calls will be reset.

Only changes that were included in the initializer of the player will be
persisted when a new API request is made.

## Player settings

Please refer to the [Player Settings](./player-settings.md) for a full list of
available settings that can be configured in the player.

Additionally, please refer to [Listening to Events](./listening-to-events.md) if
you want to register event listeners for player events.

[< back to README](https://github.com/BeyondWords-io/player#readme)

## Top-level methods

The player has a few top-level methods that you may find useful:

```javascript
BeyondWords.Player.version // The player version that is loaded, e.g. "0.1.23"

BeyondWords.Player.instances() // See above. This retrieves all initialized instances.

BeyondWords.Player.instances()[0].target // Returns the root DOM node of the player.

BeyondWords.Player.instances()[0].properties() // Returns all reactive properties as a key-value object.

BeyondWords.Player.instances()[0].destroy() // Removes a player instance, freeing its resources.

BeyondWords.Player.destroyAll() // Removes all player instances, freeing their resources.
```

It is recommended to remove player instances on single-page websites once they
are no longer needed to free up browser resources.

If you are using the `player@latest` version, it may take up to 12 hours for all
users to receive a newly released version of the player due to caching.
