[< back to README](https://github.com/BeyondWords-io/player#readme)

## Listening to Events

The player emits events in response to user actions, playback time updates,
entering full screen, etc.

You can listen to these events in your JavaScript code:

```javascript
const player = BeyondWords.Player.instances()[0];

player.addEventListener("<any>", console.log);
```

The code above registers an event listener that listens to any event and logs
it to the console.

If you only want to listen to a single event type, provide its name:

```javascript
player.addEventListener("PressedPlay", console.log);
player.addEventListener("PlaybackEnded", console.log);
```

Events contain a standard set of fields such as 'type' and 'createdAt' and some
contain additional fields.

Please refer to [Player Events](./player-events.md) for a full listing of event
types and their fields.

## Cleaning up

The return value of `addEventListener` is a string that is a handle to the
listener.

This allows you remove the listener, for example, if a React component is
unmounted:

```javascript
useEffect(() => {
  const listener = player.addEventListener("<any>", console.log);
  return () => player.removeEventListener("<any>", listener);
}, []);
```

Or when your Svelte component is unmounted:

```javascript
onMount(() => {
  const listener = player.addEventListener("<any>", console.log);
  return () => player.removeEventListener("<any>", listener);
});
```

Otherwise, the callback function will continue to be called which may result in an error in your application.

[< back to README](https://github.com/BeyondWords-io/player#readme)
