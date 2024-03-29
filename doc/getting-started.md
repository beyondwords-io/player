[< back to README](https://github.com/BeyondWords-io/player#readme)

## Getting Started

The first step is to [create an account](https://dash.beyondwords.io/auth/signup)
and generate some content.

You can then click on the embed button next to the content to add the script tag
to the `<body>` of your site.

The snippet should look like this:

```html
<script async defer
  src='https://proxy.beyondwords.io/npm/@beyondwords/player@latest/dist/umd.js'
  onload='new BeyondWords.Player({ target: this, projectId: <ID>, contentId: "<ID>" })'>
</script>
```

You will need to replace the `<ID>` placeholders with the real identifiers for
your project and content.

After refreshing the page, the player should load:

<img src="./images/standard-player.png" width="400px" />

## How it works

The script tag downloads the code for BeyondWords player and instantiates a new
player instance.

The 'async' and 'defer' attributes mean that the browser won't stall while it
downloads the script code.

The 'onload' attribute initializes a JavaScript class called 'BeyondWords.Player'.

By setting `target: this`, the player will be added immediately after the
script tag in the `<body>`. That means it will appear at the position where
you copy the script tag into your page.

## How to configure it

The preferred way to configure the player is by logging into the BeyondWords
dashboard, going to the Player tab, and changing its settings.

However, you can also override properties at the script level, for example:

```html
<script async defer
  src='https://proxy.beyondwords.io/npm/@beyondwords/player@latest/dist/umd.js'
  onload='new BeyondWords.Player({
    target: this,
    projectId: <ID>,
    contentId: "<ID>",
    playerStyle: "large",
    callToAction: "Listen to this recipe",
    backgroundColor: "yellow",
  })'>
</script>
```

These settings will take precedence over those specified in the dashboard and
allow more flexibility.

These settings can also be changed after loading the player by using the [Player SDK](./player-sdk.md).

Please refer to [Player Settings](./player-settings.md) for an explanation of all the settings that can be configured.

[< back to README](https://github.com/BeyondWords-io/player#readme)
